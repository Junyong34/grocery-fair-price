# 데이터 파이프라인 1차 설계 (초안)

공공 API 3개(KAMIS 일별, 축평원 소비자가격, 참가격)를 모아서 정제하고, 하나의 응답으로 엮어 서비스에 내보내는 구조를 처음으로 잡아 본 문서다. 필드 명세는 [api-spec.md](../10-research/api-spec.md)에 있다.

이 문서는 아직 결정이 아니다. 확정되면 로드맵 단계별 문서로 나눈다.
- 2장 → P2 `sources/*.md`
- 3~4장 → P4 `canonical-model.md`, `adapters.md`
- 5장 → P4 `adapters.md`
- 6장 → P6 ADR

용어는 [GLOSSARY.md](../../GLOSSARY.md)를 따른다.

---

## 1. 출발점: 실측으로 확인한 사실 (2026-10-08)

| | KAMIS 일별 (data.go.kr판) | 축평원 소비자가격 | 참가격 |
|---|---|---|---|
| 도메인 개념 | 소매 시세, 도매 시세 | 소매 시세 (축산) | 판매가 (점포별) |
| 조사 주기 | 평일. 공휴일은 비어 있음 (10/5 대체공휴일에 0건) | 매일. 토요일·공휴일에도 값이 있음 | 격주 금요일 |
| 언제 들어오나 | D일분이 D+1 00시 무렵(KST)에 등록 (`orgnl_reg_dt` 15:0xZ). 일부(친환경 664행)는 D+1 18시에 다시 등록됨 | D일 16:30에 조회하면 평년 행만 오고 당일 행은 없음. 등록 시각은 미확인 | 조사일 0~2일 전에 입력된 사례(9/25분 → 9/23)와 약 6일 뒤에 입력된 사례(다른 개발자 기록)가 둘 다 있음 |
| 하루 양 | 약 6,600행 (소매 5,223 / 중도매 713 / 친환경 664) | 약 53행 (축종 7개) | 조사일당 약 11만 4천 행 (상품 583 × 점포 426) |
| 1년 양 | 약 165만 행 | 약 2만 행 | 약 300만 행 (26회) |
| 하루 호출 수 | 품목 136개 → 136회 (일부 품목은 페이지가 2개 이상일 수 있음) | 축종 7개 → 7회 | 상품 604개 → 604회 (조사일마다) |
| 호출 한도 (개발계정) | 10,000/일 | 1,000/일 | 2,000/일 |
| 과거 조회 | 호출당 최대 1년 | 미확인 | **2026-06-12부터만** |
| 특이점 | 품목 136개 중 32개는 이날 0건 (꽃, 제철이 지난 과일 등). 품절이면 전일가를 최대 5일 이어 씀 | **평년 가격을 같은 응답에 함께 준다** (`standYmd=평년`) | 할인·1+1 필드 있음. 제조사 이름은 받을 수 없음 |

**출처가 겹친다.** 10/6 국산 삼겹살 소매가가 KAMIS(`4304-27` 전국)와 축평원(돼지 삼겹살) 모두 **3,027원**으로 같다. KAMIS의 축산물 소매가는 축평원 값을 그대로 가져온 것으로 보인다. 그래서 축산 품종은 출처를 하나만 쓰거나, 같은 값이면 하나로 합쳐 세야 한다. 그러지 않으면 표본 수와 신뢰도가 부풀려진다.

---

## 2. 저장 구조: 3단 분리

```
API ──▶ ① 원본 보관 (raw) ──▶ ② 정제 관측값 (observation) ──▶ ③ 집계·판정 (serving)
        파일, 압축, 영구          DB, 최근분 + 축소본            DB, 영구, 작음
```

| 층 | 무엇을 | 어디에 | 보존 기간 | 왜 |
|---|---|---|---|---|
| ① 원본 | API 응답의 모든 필드를 손대지 않고 저장. 형식만 줄 단위 JSON(NDJSON)으로 바꿔 gzip 압축 | 파일 저장소 (Supabase Storage 1GB, 또는 별도 Git 저장소) | 영구 | 변환 규칙이 바뀌면 API를 다시 부르지 않고 ②③을 다시 만든다. 무료 DB에는 백업이 없으므로 이 파일이 백업 역할도 한다 |
| ② 관측값 | 통합 모델로 바꾼 한 줄 한 줄. 단위 환산, 품종 매핑, 행사 표시를 마친 값 | Postgres | 점포 단위는 최근 N일만, 나머지는 집계로 남김 | 판정·추이를 다시 계산하고 이상치를 찾는 데 쓴다 |
| ③ 집계 | 품종 × 규격 × 날짜 × 범위(전국/시도/업태)별 대표값, 평소가, 판정 | Postgres | 영구 | 화면과 API는 이것만 읽는다 |

### 용량 추정 (Supabase 무료 500MB 기준)

추정치다. 실제로 넣어 본 뒤 `pg_total_relation_size`로 다시 잰다.

| 데이터 | 1년 행 수 | 행당 크기 (인덱스 포함 추정) | 1년 용량 |
|---|---|---|---|
| 참가격 점포별 관측값을 모두 저장할 때 | 300만 | 80B | 약 240MB |
| KAMIS 시장별 관측값을 모두 저장할 때 | 165만 | 100B | 약 165MB |
| ③ 집계 (품종 × 규격 × 날짜 × 범위) | 약 50만 | 100B | 약 50MB |

②를 모두 DB에 넣으면 **1년 안에 500MB를 거의 다 쓴다.** 그래서 이렇게 나눈다.
- 참가격 점포별 관측값은 **최근 8회 조사(16주)만** DB에 둔다. 그보다 오래된 것은 ③ 집계로만 남기고, 원본은 ① 파일에 있다.
- KAMIS 시장별 관측값은 **최근 90일만** DB에 둔다. 판정에 필요한 전국·시도 대표값은 ③에 영구 보관한다.
- 이렇게 하면 DB는 1년차에 약 100~150MB로 추정된다. ① 원본 파일은 gzip 기준 연 200~300MB로 추정되어, Storage 1GB로 약 3년을 쓸 수 있다.

---

## 3. 테이블 초안 (논리 모델)

Postgres 기준으로 쓰지만 Supabase 전용 기능에는 기대지 않는다. 나중에 다른 Postgres로 옮길 때 `pg_dump` 한 번이면 되게 하려는 것이다.

### 3-1. 분류와 매핑 (운영자가 관리)

```
category        id, name                                   -- 카테고리: 채소, 정육·계란
item            id, category_id, name                      -- 품목: 호박, 돼지고기
variety         id, item_id, slug, name, base_unit,        -- 품종: 애호박, 국산 삼겹살
                base_unit_qty, ea_to_g                     --   기준 단위(100g / 1개), 환산 기준
grade           id, variety_id, name, is_default           -- 규격: 상품, 중품, 1+
alias           id, text, item_id?, variety_id?            -- 별칭

source_code_map                                            -- 원천 코드 → 우리 품종·규격 (다대일)
  source        'kamis' | 'ekape' | 'chamga'
  source_key    'kamis:200-224-01-04' (부류-품목-품종-등급)
                'ekape:4304-27-구분없음' (축종-품목-등급)
                'chamga:246' (goodId)
  variety_id, grade_id
  unit_rule     환산 규칙 ('per_100g' / 'pack_g:300' / 'ea')
  status        'mapped' | 'ignored' | 'pending'           -- 새 코드는 pending으로 들어오고 운영자가 처리
```

원천 코드를 처음 본 순간 `pending`으로 자동 등록한다. 매핑이 없는 코드도 버리지 않고 ②까지는 저장한다. 나중에 매핑하면 과거분도 다시 계산할 수 있다.

### 3-2. 판매처와 지역

```
store           id, source, source_store_id, name, channel,  -- 점포 (참가격 entpId)
                region_code, sigungu_code, lat, lng,         -- channel: 대형마트/SSM/백화점/편의점/전통시장
                first_seen, last_seen
region          code, name, parent_code                      -- 시도·시군구. 참가격 AR 코드와 KAMIS sgg를 우리 코드로 매핑
```

### 3-3. ② 관측값

```
observation
  id              bigint
  source          'kamis' | 'ekape' | 'chamga'
  source_key      매핑 전 원천 키 (위 형식)
  variety_id      null 가능 (매핑 전)
  grade_id        null 가능
  kind            'retail_quote' 소매 시세 | 'wholesale_quote' 도매 시세 | 'shelf_price' 판매가
  obs_date        조사일
  scope           'store' | 'market' | 'sigungu' | 'national'
  region_code     null 가능
  store_id        null 가능 (참가격만)
  price_raw       원천 가격 (원)
  qty_raw, unit_raw   원천 단위 ('10', 'kg(그물망 3포기)')
  price_per_base  기준 단위 가격 (환산 실패 시 null)
  promo           null | 'discount' | 'one_plus_one'
  promo_from, promo_to
  flags           text[]: 'carried_over' 전일가 이어씀 의심, 'outlier' 이상치, 'duplicate_of_ekape' 출처 중복
  source_registered_at   원천 등록 시각 (KAMIS orgnl_reg_dt, 참가격 inputDttm)
  revision        같은 키로 값이 바뀐 횟수 (정정)
  ingest_run_id   어느 수집 실행에서 들어왔나
  unique (source, source_key, obs_date, scope, region_code, store_id)
```

- 자연키로 **upsert** 한다. 같은 날 값을 다시 받아도 행이 늘지 않고, 값이 바뀌면 `revision`이 올라간다.
- 축평원의 `평년` 행은 `obs_date`가 아니라 별도 테이블(3-4의 `reference_price`)에 넣는다.

### 3-4. ③ 집계·판정

```
daily_quote                                       -- 품종 × 규격 × 날짜 × 범위별 대표값
  variety_id, grade_id, obs_date, kind, scope_key ('national' | 'region:11' | 'channel:LM')
  median, min, max, n, sources text[], has_promo_excluded bool, stale_days int
  primary key (variety_id, grade_id, obs_date, kind, scope_key)

reference_price                                   -- 외부가 준 기준값 (축평원 평년, 나중에 KAMIS 평년·1년 전)
  variety_id, grade_id, ref_date, ref_type ('normal_year' | 'year_ago' | 'month_ago'), value, source

usual_price                                       -- 평소가 (계산식은 P5)
  variety_id, grade_id, as_of, value, method, components jsonb, confidence

judgment_snapshot                                 -- 품종 화면에 그대로 내보낼 판정 (하루 1번 재계산)
  variety_id, grade_id, as_of, today_price, usual, verdict, diff_pct, confidence, payload jsonb
```

### 3-5. 수집 상태 (장애 대응의 핵심)

```
ingest_run        id, source, started_at, finished_at, status, calls_used, error
source_day        source, obs_date, status, expected, row_count, attempts,
                  first_ok_at, last_checked_at, last_error, checksum
  status: 'pending' 아직 안 옴 | 'ok' | 'partial' 일부 품목 누락 | 'empty_expected' 휴일·격주 비는 날
          | 'empty_unexpected' 와야 하는데 없음 | 'failed' 호출 실패 | 'corrected' 받은 뒤 값이 바뀜
```

`source_day`는 소스 × 날짜마다 한 줄이다. 배치는 매번 이 표를 보고 **비어 있거나 실패한 날짜를 다시 채운다.** 마지막으로 성공한 날짜 하나만 기억하는 방식은 쓰지 않는다. 중간에 빠진 날을 놓치기 때문이다.

---

## 4. 통합 응답 (서비스 API)

세 소스를 엮어서 화면 하나에 필요한 것을 응답 하나로 준다. 화면은 출처별 API를 따로 부르지 않는다.

### 4-1. `GET /api/v1/varieties/{slug}?grade=&region=`

예: 국산 삼겹살. 값은 10/6 실측에서 가져왔고, 평소가와 판정은 예시다.

```json
{
  "variety": { "slug": "pork-belly-kr", "name": "국산 삼겹살", "item": "돼지고기", "category": "정육·계란" },
  "grade": { "id": "default", "name": "구분없음", "options": [] },
  "base_unit": { "label": "100g", "examples": [ { "qty": "200g", "price": 6054 }, { "qty": "300g", "price": 9081 } ] },

  "judgment": {
    "as_of": "2026-10-06",
    "price": 3027,
    "usual": 2724,
    "diff_pct": 11.1,
    "verdict": "expensive",
    "label": "평소보다 11% 비싸요",
    "confidence": { "level": 3, "max": 4, "reasons": ["공공 조사", "17개 시도 평균", "2일 전"] }
  },

  "range": { "min": 2856, "usual": 2724, "max": 3216, "basis": "10/06 시도별 소매 시세" },

  "quotes": [
    { "kind": "retail_quote", "source": "ekape", "scope": "national", "date": "2026-10-06", "price": 3027,
      "also_reported_by": ["kamis"] },
    { "kind": "shelf_price", "source": "chamga", "date": "2026-09-25", "n_stores": 8,
      "by_channel": { "LM": 3280, "SM": 3067, "DP": 4941 }, "promo_excluded": 0 }
  ],

  "trend": {
    "period": "3m",
    "series": [
      { "key": "retail_national", "label": "전국 평균 시세", "points": [["2026-10-06", 3027], ["2026-10-07", 2990]] },
      { "key": "usual", "label": "평소 가격", "points": [["2026-10-06", 2724]] }
    ],
    "promo_periods": []
  },

  "freshness": [
    { "source": "ekape", "latest": "2026-10-07", "status": "ok" },
    { "source": "kamis", "latest": "2026-10-07", "status": "ok" },
    { "source": "chamga", "latest": "2026-09-25", "status": "ok", "next_expected": "2026-10-09" }
  ],
  "notices": [],
  "attribution": [
    "축산물품질평가원 축산물유통정보",
    "한국농수산식품유통공사 KAMIS",
    "한국소비자원 참가격"
  ]
}
```

- `also_reported_by`: 1장에서 본 출처 중복을 화면에서 한 번만 세려고 둔다.
- `freshness`와 `notices`: 5장의 장애 상황을 화면에 알리는 통로다. 예: `{"type": "stale", "source": "kamis", "message": "어제 시세가 아직 들어오지 않아 10/06 기준이에요"}`
- `attribution`: 공공누리 출처표시 의무를 지키려고 둔다.

### 4-2. `POST /api/v1/judge` (진열대 앞 즉시 판정)

```json
// 요청
{ "variety": "pork-belly-kr", "grade": "default", "price": 15900, "qty": 500, "unit": "g", "promo": null }
// 응답
{ "price_per_base": 3180, "usual": 2724, "diff_pct": 16.7, "verdict": "expensive",
  "label": "평소보다 17% 비싸요", "converted": "500g → 100g당 3,180원", "confidence": { "level": 3, "max": 4 } }
```

판정은 `judgment_snapshot`의 평소가를 읽어 계산만 한다. 요청마다 공공 API를 부르지 않는다.

### 4-3. 응답을 만드는 시점

- 배치가 끝날 때 품종별 `judgment_snapshot.payload`를 4-1 모양으로 **미리 만들어 둔다.** API는 그것을 그대로 읽는다.
- 같은 내용을 정적 JSON으로 내보내 CDN 캐시나 정적 페이지 생성(SEO 품종 페이지)에 써도 된다. martmemo-data 방식은 이 단계에서만 빌려 온다.

---

## 5. 장애 보정·회피 설계

### 5-1. 수집 일정 (지연을 전제로 짠다)

| 소스 | 언제 돈다 (KST) | 무엇을 받나 | 왜 |
|---|---|---|---|
| KAMIS | 매일 06:30 | 어제(D-1) + **다시 받기** D-2·D-3 | D일분이 D+1 0시 무렵 들어오고, 일부는 D+1 18시에 다시 등록되기 때문. 사흘을 매번 다시 받아 upsert하면 정정도 같이 잡힌다. 호출 약 136 × 3 = 408회 |
| 축평원 | 매일 06:40 | D-1 + 다시 받기 D-2·D-3 | 당일 16:30에는 아직 없었다. 호출 7 × 3 = 21회 |
| 참가격 | 매일 07:00 (가볍게) | 아직 못 받은 가장 최근 조사일(금요일)이 있는지 상품 3개로 확인. 있으면 604회로 전체 수집 | 입력 시점이 조사일 앞뒤로 들쭉날쭉하다. 매일 3회만 써서 확인하고, 찾은 날만 전체를 받는다 |
| 재계산 | 수집이 끝난 직후 | ② → ③, 판정 스냅샷 | |

정확한 등록 시각을 알게 되면 수집 시각을 앞당긴다. 처음 2주는 `source_day.first_ok_at`을 쌓아서 실제 도착 시각을 잰다.

### 5-2. 상황별 처리

| 상황 | 감지 | 보정 | 화면 |
|---|---|---|---|
| **아직 안 옴** (하루 늦음) | `source_day.status = pending`, 다음 실행까지 0건 | 다음 실행이 빈 날을 다시 받는다. 3일 동안 다시 시도한다 | 마지막 정상 날짜의 값을 쓰고 "10/06 기준"으로 표시. `freshness.status = delayed` |
| **휴일이라 비는 날** | 공휴일 달력(KAMIS), 격주 달력(참가격)에 있는 날이면 `empty_expected` | 하지 않음 | 지연이 아니므로 경고하지 않음 |
| **와야 하는데 빔** | 평일인데 KAMIS 0건, 조사 주인데 참가격 0건 → `empty_unexpected` | 3일 동안 다시 시도하고, 그래도 없으면 알림 | "최근 시세가 늦어지고 있어요". 신뢰도 1단계 낮춤 |
| **일부만 옴** | 품목별 건수가 최근 4주 같은 요일 평균의 50% 미만 → `partial` | 해당 품목만 다시 받음 | 해당 품종만 지연으로 표시 |
| **호출 실패** (시간 초과, 게이트웨이 오류) | HTTP 오류, `OpenAPI_ServiceResponse` | 2s/4s/8s 간격으로 3번 재시도. 실패하면 `failed`로 남기고 다음 실행에서 다시 받음 | 서비스는 ③ 집계를 읽으므로 영향 없음 |
| **한도 초과** | 게이트웨이의 한도 오류 메시지 | 그날은 멈추고 다음 날 이어서 받음. 실행마다 호출 예산을 둔다 (참가격 1,500 / 축평원 800 / KAMIS 8,000) | 영향 없음 |
| **받은 뒤 값이 바뀜** (정정) | upsert 때 가격이 다름 → `revision++`, `source_day.status = corrected` | 해당 날짜의 ③을 다시 계산 | 판정이 바뀔 수 있음 (조용히 갱신) |
| **전일가를 이어 씀** (KAMIS 품절) | 같은 품종·시장 가격이 3일 이상 똑같음 → `flags += carried_over` | 평소가 계산에서는 첫날 값만 1번 센다 | "갱신 지연" 표시, 신뢰도 낮춤 |
| **이상치** | 전날 대비 ±50% 이상이거나, 같은 날 다른 시장 중앙값의 3배 이상 → `outlier` | 집계에서 빼고 원본은 남김 | 표시하지 않음 |
| **출처 중복** | KAMIS 축산 소매 = 축평원 같은 날 같은 값 → `duplicate_of_ekape` | 집계에서 한 번만 센다 | `also_reported_by` |
| **응답 형식이 바뀜** | 필수 필드가 없거나 타입이 다름, 처음 보는 코드 | 해당 행은 ②로 넘기지 않고 ① 원본에만 저장. 처음 보는 코드는 `source_code_map`에 `pending`으로 등록 | 영향 없음. 운영자 알림 |
| **소스가 오래 멈춤** (7일 이상) | `source_day` 연속 실패 | 다른 소스로 판정 (예: 축산은 축평원이 멈추면 KAMIS) | 판정은 유지하되 "○일 전 기준" + 신뢰도 낮춤. 모든 소스가 멈추면 마지막 판정 + 안내 배너 |

### 5-3. 알림

- 수집이 실패하거나 `empty_unexpected`가 생기면 알림을 보낸다. 실행 환경의 실패 메일이나 GitHub 이슈 자동 생성 정도로 시작한다.
- martmemo-data는 GitHub 서버에서 data.go.kr로 연결 시간 초과가 2주 연속 났다. 그래서 "다음 실행에서 자동으로 메운다"만으로는 부족하다. **2회 연속 실패하면 사람이 알아야 한다.**

### 5-4. 과거분 채우기 (최초 1회)

| 소스 | 방법 |
|---|---|
| KAMIS | data.go.kr판으로 기간 조회 (호출당 최대 1년). 평년·1년 전 값은 KAMIS 자체 API(cert_key, 승인 대기 중)로 |
| 축평원 | 과거 조회 범위를 먼저 실측. 평년은 매일 응답에 들어 있음 |
| 참가격 | 2026-06-12 이후는 API로. 그 전은 공공데이터포털 파일데이터(생필품 가격동향 XLS)로 채울지 P3에서 판단 |

---

## 6. 실행 환경 추천

조건: 당장 비용을 쓰지 않는다. 서비스가 커지면 옮긴다.

### 추천: Vercel (화면·API) + Supabase Free (DB·파일) + GitHub Actions (배치)

```
GitHub Actions (cron) ──수집·정제──▶ Supabase Postgres ◀──읽기── Vercel (Next.js 화면 + API 라우트)
        └──원본 gzip──▶ Supabase Storage (또는 Git 저장소)
```

| 역할 | 선택 | 무료 조건 | 주의 |
|---|---|---|---|
| DB | Supabase Free | DB 500MB, 파일 1GB, egress 5GB, 무료 프로젝트 2개 (supabase.com/pricing, 2026-10-08 확인) | **1주일 동안 활동이 없으면 일시정지된다.** 매일 도는 배치가 막아 줄 것으로 보이지만, 무엇을 활동으로 치는지 확인해야 한다. **무료 플랜에는 자동 백업이 없다** → ① 원본 파일이 백업 역할 |
| 배치 | GitHub Actions | 공개 저장소는 무료. 비공개 저장소는 월 무료 분량 안에서 | Vercel 크론보다 실행 시간 제한이 넉넉하다 (참가격 604회 호출에 몇 분 걸림). GitHub 서버 → data.go.kr 연결 시간 초과 사례가 있음 (5-3) |
| 화면·API | Vercel Hobby | (이 네트워크에서 vercel.com 접속이 차단되어 직접 확인 못 함) | **확인 필요:** Hobby 플랜이 개인·비상업용으로 제한되는지. 광고나 제휴 링크로 수익을 내면 Pro로 바꿔야 할 수 있다 |
| 원본 파일 | Supabase Storage 1GB | 위와 같음 | 약 3년치. 넘치면 Git 저장소나 다른 오브젝트 스토리지로 |

Supabase 프로젝트는 **서울 리전**으로 만든다. data.go.kr과 사용자가 모두 국내에 있기 때문이다 (리전 선택지는 생성 화면에서 확인).

### Railway는 지금은 아니다

docs.railway.com/pricing/plans (2026-10-08 확인) 기준이다.
- Free 플랜은 월 $1 크레딧에 RAM 0.5GB, 볼륨 0.5GB다. Postgres를 항상 켜 두면 RAM 비용만으로 $1를 넘는다 (RAM $10/GB/월).
- 실사용은 Hobby $5/월부터다. $5 사용량이 포함된다.
- 장점은 배치 워커와 Postgres를 한곳에서 돌릴 수 있다는 점이다. 그래서 **옮겨 갈 후보**로 둔다. 서비스가 커져서 GitHub Actions + Supabase Free로 부족해질 때 다시 본다.

### 나중에 옮기기 쉽게 지킬 것

- **DB는 순수 Postgres로만 쓴다.** 테이블, 인덱스, SQL 뷰까지만 쓴다. Supabase Edge Functions나 Supabase 전용 기능에 업무 로직을 넣지 않는다. 그래야 Railway, Neon, RDS 어디로든 `pg_dump`/`pg_restore`로 옮길 수 있다.
- 수집·정제 코드는 실행 환경과 무관한 CLI 하나로 만든다. 예: `ingest --source kamis --date 2026-10-06`. GitHub Actions든 Railway든 크론이 이 명령만 부르게 한다.
- 접속 정보는 환경변수 `DATABASE_URL` 하나로 받는다.

---

## 7. 열린 질문

| 질문 | 정할 단계 |
|---|---|
| 축산 품종의 대표 출처를 축평원과 KAMIS 중 무엇으로 할지 (값이 같음) | P4 |
| 참가격 점포별 관측값을 DB에 몇 회분 둘지 (용량 실측 후) | P4 / P6 |
| KAMIS 친환경·중도매를 저장할지 (도매 시세는 예고 문구에 씀) | P3 |
| 평소가 계산식 (축평원 평년, KAMIS 평년, 최근 N주 중앙값을 섞는 방식) | P5 |
| 판정 스냅샷 재계산 주기 (하루 1번 vs 수집 직후마다) | P6 |
| Vercel Hobby 상업 이용 제한 여부 | P6 (사용자 확인) |
| Supabase Free 일시정지 기준과 배치로 막을 수 있는지 | P6 |
| 축평원 D일분 등록 시각, 과거 조회 범위 | P2 (실측) |
