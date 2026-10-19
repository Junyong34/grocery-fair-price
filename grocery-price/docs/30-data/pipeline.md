# 데이터 파이프라인 설계

공공 API 3개(KAMIS 일별, 축평원 소비자가격, 참가격)를 모아서 정제하고, 화면이 읽을 집계와 판정으로 만드는 구조다. 로드맵 ① 수집 기반의 설계 문서이며, 필드 명세는 [api-spec.md](../10-research/api-spec.md)에 있다. 실행 환경은 [ADR 0002](../adr/0002-supabase-and-github-actions.md)로 정했다 (Supabase Postgres + Storage, GitHub Actions).

처음에는 초안(`pipeline-draft.md`)으로 쓰고 확정되면 여러 문서로 나눌 계획이었다. 같은 내용을 여러 번 옮겨 적게 되어 2026-10-19에 이 문서 하나를 정식 설계로 올렸다. 테이블 DDL은 `supabase/migrations/`가, 변환 규칙의 세부는 수집 패키지의 테스트가 기준이다. 아직 정하지 않은 것은 7장에 있다.

용어는 [GLOSSARY.md](../../GLOSSARY.md)를 따른다.

---

## 1. 출발점: 실측으로 확인한 사실 (2026-10-08)

| | KAMIS 일별 (data.go.kr판) | 축평원 소비자가격 | 참가격 |
|---|---|---|---|
| 도메인 개념 | 소매 시세, 도매 시세 | 소매 시세 (축산) | 판매가 (점포별) |
| 조사 주기 | 평일 (축산은 매일). 공휴일은 비어 있음 (10/5 대체공휴일에 0건). 근로자의 날·선거일·제헌절도 비고, 이유 모를 빈 날도 있음 (2025-12-05) ([kamis.md 7장](sources/kamis.md)) | 매일. 토요일·공휴일에도 값이 있음 | 격주 금요일 |
| 언제 들어오나 | D일분이 대개 D일 23시~D+1 02시(KST)에 등록 (`orgnl_reg_dt`). 최근에는 D+2~D+3에 등록된 날도 있음. 일부(친환경 664행)는 D+1 18시에 다시 등록됨. 축산은 등록 시각이 없음 ([kamis.md 6-1](sources/kamis.md)) | D일 16:30 이후 ~ D+1 10:10 이전 (시각 미확정, [sources/ekape.md](sources/ekape.md) 9장) | 조사일 2일 전~7일 뒤에 입력됨. 우리 실측: 10-09분이 10-15~16에 입력 ([chamgagyeok.md 5-3](sources/chamgagyeok.md)) |
| 하루 양 | 약 6,600행 (소매 5,223 / 중도매 713 / 친환경 664) | 당일 27 + 평년 27 = 54행 안팎 (축종 7개. 날마다 조합이 조금 다름) | 조사일당 약 11.8만 행 (파일데이터 15083256 기준, 생활용품 포함). 일반 신선식품은 점포 약 9곳뿐 |
| 1년 양 | 약 165만 행 | 약 2만 행 | 약 300만 행 (26회) |
| 하루 호출 수 | 품목 136개 → 136회 (일부 품목은 페이지가 2개 이상일 수 있음. 소매로 실제 오는 품목은 94개, [item-inventory.md](sources/item-inventory.md)) | 축종 7개 → 7회 | 식품 457개 → 457회 (상품 기준, 생활용품 제외. 조사일마다) |
| 호출 한도 (개발계정) | 10,000/일 | 1,000/일 | 2,000/일 |
| 과거 조회 | 기간 제한 없음. 호출 수 = ceil(행 수/1000): 축산 외 품목당 5년 60~100회, 소 437회 ([kamis.md 8장](sources/kamis.md)) | 하루 단위 조회. 전국 값은 2012-06 이전부터, 시도 값은 2022-01부터. 2021년 이전은 공휴일이 빔 ([ekape.md 10장](sources/ekape.md)) | **2026-06-12부터만** |
| 특이점 | 품목 136개 중 32개는 이날 0건 (꽃, 제철이 지난 과일 등). 최근 30일 기준 소매로 오는 것은 94개 품목, 186개 품종×등급 조합. "품절 시 전일가 최대 5일"은 출처 미확인이고, 실측상 같은 값이 66 조사일까지 이어진다. 이월 판정 기준은 판정 설계(②)에서 다시 정한다 ([kamis.md 6-4](sources/kamis.md)) | **평년 가격을 같은 응답에 함께 준다** (`standYmd=평년`) | 할인·1+1 필드 있음. 제조사 이름은 받을 수 없음 |

**출처가 겹친다.** 10/6 국산 삼겹살 소매가가 KAMIS(`4304-27` 전국)와 축평원(돼지 삼겹살) 모두 **3,027원**으로 같다. 10-16·10-18 실측으로 다시 비교해도 **같은 값이다.** KAMIS의 축산물 소매가는 축평원 값이다. 다만 KAMIS가 더 많이 준다 (한우 1++등급, 계란 규격별, 닭 호수별). 축평원에만 있는 것은 평년 행과 수입 소고기 일부다 ([ekape.md 8장](sources/ekape.md), [item-inventory.md 5-1](sources/item-inventory.md)). 그래서 축산 품종은 출처를 하나만 쓰거나, 같은 값이면 하나로 합쳐 세야 한다. 그러지 않으면 표본 수와 신뢰도가 부풀려진다.

---

## 2. 저장 구조: 3단 분리

```
API ──▶ ① 원본 보관 (raw) ──▶ ② 정제 관측값 (observation) ──▶ ③ 집계·판정 (serving)
        파일, 압축, 영구          DB, 최근분 + 축소본            DB, 영구, 작음
```

| 층 | 무엇을 | 어디에 | 보존 기간 | 왜 |
|---|---|---|---|---|
| ① 원본 | API 응답의 모든 필드를 손대지 않고 저장. 형식만 줄 단위 JSON(NDJSON)으로 바꿔 gzip 압축 | Supabase Storage (무료 1GB) | 영구로 시작. 용량 실측 후 1년 지난 원본 삭제를 검토 | 변환 규칙이 바뀌면 API를 다시 부르지 않고 ②③을 다시 만든다. 무료 DB에는 백업이 없으므로 이 파일이 백업 역할도 한다 |
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

가격 품종 ID(`variety.slug`)는 제철 패키지(`packages/seasonal`)의 품종 ID와 **별도 체계**로 둔다. 두 체계는 매핑표(`variety_seasonal_map`: 가격 품종 ↔ 제철 품종 id)로 잇는다 (2026-10-19 결정). 상품→품종은 참가격 소분류 단위로 묶고 예외만 고친다. 점포→판매처 매핑(`store.seller`)도 운영자가 관리한다 (참가격 2단 평균에 필요, [gov-price-sites.md](../10-research/gov-price-sites.md) 1장).

```
category        id, name                                   -- 카테고리: 채소, 정육·계란
item            id, category_id, name                      -- 품목: 호박, 돼지고기
variety         id, item_id, slug, name, base_unit,        -- 품종: 애호박, 국산 삼겹살
                base_unit_qty, ea_to_g                     --   기준 단위(100g / 1개), 환산 기준
grade           id, variety_id, name, is_default           -- 규격: 상품, 중품, 1+
alias           id, text, item_id?, variety_id?            -- 별칭

source_code_map                                            -- 원천 코드 → 우리 품종·규격 (다대일)
  source        'kamis' | 'ekape' | 'chamga'
  source_key    'kamis:01-200-224-01-04' (구분-부류-품목-품종-등급)
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
                seller,                                      -- 판매처 (이마트, 롯데슈퍼, CU …). 운영자 매핑
                region_code, sigungu_code, lat, lng,         -- channel: 대형마트/SSM/백화점/편의점/전통시장
                first_seen, last_seen
market          id, source_market_code, name, sigungu_code,  -- KAMIS 조사 시장 (mrkt_cd)
                market_type                                  -- 'traditional' 실명 전통시장(경동, 부전 …) | 'large_retail' 익명 대형유통(A-유통 …) | 'wholesale'
                                                             --   | 'eco_channel' 07 친환경 익명 업태 | 'online' | 'other' ([kamis.md 5장](sources/kamis.md))
                                                             -- 축산은 조사 시장이 없다 (시도·전국 평균만)
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
  market_id       null 가능 (KAMIS 조사 시장. 축산은 없음)
  price_raw       원천 가격 (원). 참가격 goodPrice는 행사가 반영된 값
  qty_raw, unit_raw   원천 단위 ('10', 'kg(그물망 3포기)')
  price_per_base  기준 단위 가격 (환산 실패 시 null)
  promo           'none' | 'discount' | 'one_plus_one' | null   -- 참가격 goodDcYn·plusoneYn 필드 없음 = null(모름). 'none'(N)과 다르다
  promo_from, promo_to
  flags           text[]: 'carried_over' 전일가 이어씀 의심, 'outlier' 이상치, 'duplicate_of_ekape' 출처 중복
  source_registered_at   원천 등록 시각 (KAMIS orgnl_reg_dt = 마지막 재등록 시각, 참가격 inputDttm). 축평원은 원천 필드가 없어 null
  first_seen_at   우리가 그 값을 처음 받은 시각 (orgnl_reg_dt는 재등록 때 덮어쓰여 첫 등록을 모른다)
  revision        같은 키로 값이 바뀐 횟수 (정정)
  ingest_run_id   어느 수집 실행에서 들어왔나
  unique nulls not distinct (source, source_key, obs_date, scope, region_code, store_id, market_id)
                  -- null 허용 열(region_code, store_id, market_id)이 있어 NULLS NOT DISTINCT
```

- KAMIS 소매 응답의 `mrkt_nm`에는 실명 전통시장과 익명 대형유통("X-유통")이 함께 온다 (배추 14일 샘플: 조사 시장 48곳(코드 기준) 중 실명 16곳, `X-유통` 32곳. 이름 기준으로는 15개·9개. [kamis.md 5-2](sources/kamis.md)). 그래서 신선식품의 **전통시장 대 대형유통** 추이는 KAMIS로 만든다. 참가격에는 전통시장 점포가 없다(630곳 중 0곳).
- 자연키로 **upsert** 한다. 같은 날 값을 다시 받아도 행이 늘지 않고, 값이 바뀌면 `revision`이 올라간다.
- 축평원의 `평년` 행은 `obs_date`가 아니라 별도 테이블(3-4의 `reference_price`)에 넣는다.
- 축평원 수집의 성공 판정은 `resultCode = 00` **그리고** 당일 행 1개 이상이다. 평년 행만 오는 날이 있다 ([ekape.md 13장](sources/ekape.md)).
- 참가격 점포는 새 `entpId`로 다시 등록되기도 한다 (광주·전남 15곳). 옛 ID와 새 ID를 이어 붙여야 한다. 편의점 4곳은 서울 본사라 지역 집계에서 빼고 전국 집계에만 넣는다 ([chamgagyeok.md 7장·10장](sources/chamgagyeok.md)).

### 3-4. ③ 집계·판정

```
daily_quote                                       -- 품종 × 규격 × 날짜 × 범위별 대표값
  variety_id, grade_id, obs_date, kind, scope_key ('national' | 'region:11' | 'channel:LM' | 'market_type:traditional' | 'market_type:large_retail')
  median, min, max, n, sources text[], has_promo_excluded bool, stale_days int
  primary key (variety_id, grade_id, obs_date, kind, scope_key)

reference_price                                   -- 평년 등 비교값. 축평원 평년(응답에 포함), KAMIS 평년(5년 이력으로 직접 계산)
  variety_id, grade_id, ref_date, ref_type ('normal_year' | 'year_ago' | 'month_ago'), value, source

usual_price                                       -- 평소가 (계산식은 로드맵 ②)
  variety_id, grade_id, as_of, value, method, components jsonb, confidence

judgment_snapshot                                 -- 품종 화면에 그대로 내보낼 판정
  variety_id, grade_id, as_of, today_price, usual, verdict, diff_pct, confidence, payload jsonb
```

- 업태별·시장 유형별 `daily_quote`는 **영구 보관**한다. 2장의 "시장별 관측값 90일" 규칙은 ② 관측값에만 적용된다. 업태별 추이 차트가 이 집계를 읽는다.
- 판정 스냅샷은 새 계산이 모두 성공했을 때만 한 트랜잭션으로 바꾼다. 재계산이 실패하면 직전 스냅샷이 그대로 남는다.

### 3-5. 수집 상태 (장애 대응의 핵심)

```
ingest_run        id, source, started_at, finished_at, status, calls_used, error
source_day        source, obs_date, status, expected, row_count, attempts,
                  first_ok_at, last_checked_at, last_error, checksum
  status: 'pending' 아직 안 옴 | 'ok' | 'partial' 일부 품목 누락 | 'empty_expected' 휴일·격주 비는 날
          | 'empty_unexpected' 와야 하는데 없음 | 'failed' 호출 실패 | 'corrected' 받은 뒤 값이 바뀜
```

`source_day`는 출처 × 날짜마다 한 줄이다. 배치는 매번 이 표를 보고 **비어 있거나 실패한 날짜를 다시 채운다.** 마지막으로 성공한 날짜 하나만 기억하는 방식은 쓰지 않는다. 중간에 빠진 날을 놓치기 때문이다.

---

## 4. 화면이 읽는 모양

세 출처를 엮어서 화면 하나에 필요한 것을 `judgment_snapshot.payload` 하나로 준다. 화면은 출처별 테이블을 따로 읽지 않는다. MVP에서는 공개 REST API를 두지 않고, `apps/web`의 서버 컴포넌트가 DB를 직접 읽는다 (읽는 방식은 `ingest-foundation/06`). 외부용 `/api/v1`은 확장 단계 E5다.

### 4-1. 품종 판정 payload (`/seasonal`과 같은 앱의 품종 가격 화면이 읽음)

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

### 4-2. 진열대 앞 즉시 판정 (클라이언트 계산)

```json
// 요청
{ "variety": "pork-belly-kr", "grade": "default", "price": 15900, "qty": 500, "unit": "g", "promo": null }
// 응답
{ "price_per_base": 3180, "usual": 2724, "diff_pct": 16.7, "verdict": "expensive",
  "label": "평소보다 17% 비싸요", "converted": "500g → 100g당 3,180원", "confidence": { "level": 3, "max": 4 } }
```

사용자가 본 가격을 입력하면 화면에 이미 받은 평소가로 브라우저에서 계산한다. 위 모양은 그 계산의 입력·출력 예시다. 서버 호출도, 공공 API 호출도 없다.

### 4-3. 응답을 만드는 시점

- 배치가 끝날 때 품종별 `judgment_snapshot.payload`를 4-1 모양으로 **미리 만들어 둔다.** 화면은 그것을 그대로 읽는다.
- 웹앱은 이 값을 캐시하고, 수집·재계산이 끝나면 갱신 신호를 받아 캐시를 버린다 (`ingest-foundation/06`).

---

## 5. 장애 보정·회피 설계

### 5-1. 수집 일정 (지연을 전제로 짠다)

| 출처 | 언제 돈다 (KST) | 무엇을 받나 | 왜 |
|---|---|---|---|
| KAMIS | 매일 06:30 | D-3~D-1을 품목당 **기간 호출 1회**로 (약 136회) + `orgnl_reg_dt` 기준 **재등록 감시** (`cond[orgnl_reg_dt::GTE]`, 품목당 대개 1회) | D일분은 대개 D+1 02시 전에 들어오지만 D+2~D+3도 있다. 재등록은 몇 달 뒤에도 있다 (15일 넘게 뒤 7%). 사흘을 매번 다시 받아 upsert하고, 재등록된 행은 가격을 비교해 정정을 잡는다 ([kamis.md 6-3](sources/kamis.md)) |
| 축평원 | 매일 06:40 | D-1 + 다시 받기 D-2·D-3 | D일분은 D일 16:30 이후 ~ D+1 10:10 이전에 올라온다 ([ekape.md 9장](sources/ekape.md)). 호출 7 × 3 = 21회 |
| KAMIS (주간) | 매주 월요일 07:10 | 최근 14일 다시 받기 (보조) | 재등록 감시(명세 밖 조건)를 보완한다. 14일 재수집만으로는 장기 재등록을 못 잡으므로 감시가 주, 주기적 기간 재수집은 보조다. 품목당 기간 조회 1회지만 축산은 매일분이라 여러 페이지(소 4회) ([kamis.md 9장](sources/kamis.md)) |
| 참가격 | 매일 07:00 (가볍게) | 확정되지 않은 최근 금요일 2개 × 상품 3개(`1000`, `1395`, `1075`)로 조사일 감지. 있으면 전체 수집. 행 수가 두 번 연속 같고 마지막 `inputDttm`이 하루 넘게 지날 때까지 매일 다시 받고, 그다음 주 월요일에 한 번 더 받는다. 금요일 뒤 10일이 지나도 비면 빈 조사일(`empty_expected`)로 닫는다 | 입력이 조사일 2일 전~7일 뒤로 퍼지고, 한 조사일 안에서도 며칠에 나뉘어 들어온다 ([chamgagyeok.md 5-4](sources/chamgagyeok.md)) |
| 재계산 | 수집이 끝난 직후 | ② → ③, 판정 스냅샷 | |

cron은 UTC로 적는다 (KST 06:30 = `30 21 * * *`). GitHub Actions의 정기 실행은 몇 분~수십 분 늦거나 빠질 수 있으므로, 시각에 기대지 않고 `source_day`의 빈 날을 메우는 방식으로 짠다.

KAMIS `orgnl_reg_dt`는 재등록 때 덮어쓰이므로, 처음 받은 시각은 우리 쪽 `observation.first_seen_at`에 남긴다.

정확한 등록 시각을 알게 되면 수집 시각을 앞당긴다. 처음 2주는 `source_day.first_ok_at`을 쌓아서 실제 도착 시각을 잰다.

### 5-2. 상황별 처리

| 상황 | 감지 | 보정 | 화면 |
|---|---|---|---|
| **아직 안 옴** (하루 늦음) | `source_day.status = pending`, 다음 실행까지 0건 | 다음 실행이 빈 날을 다시 받는다. 3일 동안 다시 시도한다 | 마지막 정상 날짜의 값을 쓰고 "10/06 기준"으로 표시. `freshness.status = delayed` |
| **휴일이라 비는 날** | 공휴일 달력(KAMIS)에 있는 날이면 `empty_expected`. 참가격은 격주 달력을 예상값으로만 쓰고, 금요일 뒤 10일이 지나도 비어야 `empty_expected`로 닫는다 (5-1, [chamgagyeok.md 5-4](sources/chamgagyeok.md)) | 하지 않음 | 지연이 아니므로 경고하지 않음 |
| **와야 하는데 빔** | 평일인데 KAMIS 0건, 조사 주인데 참가격 0건 → `empty_unexpected` | 3일 동안 다시 시도하고, 그래도 없으면 알림 | "최근 시세가 늦어지고 있어요". 신뢰도 1단계 낮춤 |
| **일부만 옴** | 품목별 건수가 최근 4주 같은 요일 평균의 50% 미만 → `partial`. 참가격은 [chamgagyeok.md 9장](sources/chamgagyeok.md) 기준을 따른다 (조사일 전체 80%, 판매처 50%, 사라짐 확정은 N=3 연속 결측) | 해당 품목만 다시 받음 | 해당 품종만 지연으로 표시 |
| **호출 실패** (시간 초과, 게이트웨이 오류) | HTTP 오류, `OpenAPI_ServiceResponse` | 2s/4s/8s 간격으로 3번 재시도. 실패하면 `failed`로 남기고 다음 실행에서 다시 받음 | 서비스는 ③ 집계를 읽으므로 영향 없음 |
| **한도 초과** | 게이트웨이의 한도 오류 메시지 | 그날은 멈추고 다음 날 이어서 받음. 실행마다 호출 예산을 둔다 (참가격 1,500 / 축평원 800 / KAMIS 8,000) | 영향 없음 |
| **받은 뒤 값이 바뀜** (정정) | upsert 때 가격이 다름 → `revision++`, `source_day.status = corrected` | 해당 날짜의 ③을 다시 계산 | 판정이 바뀔 수 있음 (조용히 갱신) |
| **전일가를 이어 씀** (KAMIS 품절) | 같은 품종·시장 가격이 3일 이상 똑같음 → `flags += carried_over` | 평소가 계산에서는 첫날 값만 1번 센다. 기준 일수는 판정 설계(②)에서 다시 정한다 ([kamis.md 6-4](sources/kamis.md)) | "갱신 지연" 표시, 신뢰도 낮춤 |
| **이상치** | 전날 대비 ±50% 이상이거나, 같은 날 다른 시장 중앙값의 3배 이상 → `outlier` | 집계에서 빼고 원본은 남김 | 표시하지 않음 |
| **출처 중복** | KAMIS 축산 소매 = 축평원 같은 날 같은 값 → `duplicate_of_ekape` | 집계에서 한 번만 센다 | `also_reported_by` |
| **키 만료·미등록** | data.go.kr 인증 오류(`SERVICE_KEY_IS_NOT_REGISTERED_ERROR`, 코드 30 등), HTTP 401·403 | 재시도하지 않는다 (같은 키로 다시 불러도 안 된다). 그 출처 수집을 멈춤 | 영향 없음. **즉시 알림** |
| **개발계정 활용기간 만료** | 활용기간 종료일 30일 전 (달력에 기록해 둔 날짜) | 운영계정 전환 신청 (활용사례 등록 등 요건 확인). 종료일 전에 처리 | 영향 없음. 30일·7일 전 알림 |
| **DB에 연결 못 함** | Postgres 연결·쓰기 실패 | 원본은 먼저 Storage에 올리고, `pending_load` 표시를 남긴다. 다음 실행이 Storage 원본으로 다시 적재 | 영향 없음 (마지막 집계 유지) |
| **재계산 실패** | ②→③ 계산 중 오류 | 트랜잭션을 되돌려 직전 `judgment_snapshot`을 유지. 다음 실행에서 다시 계산 | 직전 판정 + "○일 기준" |
| **응답 형식이 바뀜** | 필수 필드가 없거나 타입이 다름, 처음 보는 코드 | 해당 행은 ②로 넘기지 않고 ① 원본에만 저장. 처음 보는 코드는 `source_code_map`에 `pending`으로 등록 | 영향 없음. 운영자 알림 |
| **출처가 오래 멈춤** (7일 이상) | `source_day` 연속 실패 | 다른 출처로 판정. 단 축산은 대체 출처가 없다: KAMIS 축산은 축평원 값을 쓰므로 같이 멈춘다 | 판정은 유지하되 "○일 전 기준" + 신뢰도 낮춤. 모든 출처가 멈추면 마지막 판정 + 안내 배너 |

### 5-3. 알림

- 수집이 실패하거나 `empty_unexpected`가 생기면 알림을 보낸다. 실행 환경의 실패 메일이나 GitHub 이슈 자동 생성 정도로 시작한다.
- martmemo-data는 GitHub 서버에서 data.go.kr로 연결 시간 초과가 2주 연속 났다. 그래서 "다음 실행에서 자동으로 메운다"만으로는 부족하다. **2회 연속 실패하면 사람이 알아야 한다.**
- 같은 원인의 알림은 하나로 묶는다. 이미 열린 자동 이슈가 있으면 새로 만들지 않고 댓글만 단다.
- 수집 상태(출처별 마지막 정상 날짜, `source_day` 상태, 최근 실패)는 운영자 화면에서 본다. 기존 `/admin`(로컬 개발 서버 전용)에 붙이는 것을 우선 검토한다.

### 5-3-1. GitHub Actions 운영

- 작업마다 `concurrency` 그룹을 둬서 같은 출처 수집이 겹쳐 돌지 않게 하고, `timeout-minutes`를 건다.
- 공개 저장소는 60일 동안 커밋이 없으면 정기 실행이 꺼진다. 수집 상태 점검 작업이 꺼짐을 감지하거나, 운영자가 달력에 확인 일정을 둔다.
- 비밀값(`DATA_GO_KR_SERVICE_KEY`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)은 Actions Secrets에만 둔다. 로그에 찍지 않는다.
- 로컬 탐색(`fetch-samples.sh`, 계약 테스트)과 Actions가 **같은 키, 같은 일일 한도**를 쓴다. 수집 시각 앞뒤로 로컬에서 대량 호출하지 않는다.
- Supabase Free는 활동이 없으면 일시정지된다. 매일 도는 수집이 막아 주는지 확인한다. 무료 플랜에는 자동 백업이 없으므로 주 1회 `pg_dump`를 Storage나 Actions 아티팩트로 남긴다.

### 5-4. 과거분 채우기 (최초 1회)

| 출처 | 방법 |
|---|---|
| KAMIS | data.go.kr판으로 기간 조회 (기간 제한 없음. 호출 수 = ceil(행 수/1000), 축산 외 품목당 5년 60~100회, 소 437회. 동시에 여러 개 보내면 HTTP 504가 나므로 하나씩, 연 단위로 나눠 받는다. [kamis.md 8장](sources/kamis.md)). **최근 5년**을 받아 평년을 직접 계산한다. 평년·1년 전 값을 주는 KAMIS 자체 API(cert_key)는 키가 없어 쓰지 않는다. 화면 차트는 1년까지만, 5년 치는 평년 계산용 |
| 축평원 | 하루 단위로만 조회된다. 5년 백필 = 1,826일 × 7축종 = 12,782회, 실행당 예산 800으로 약 16일 ([ekape.md 10·11장](sources/ekape.md)). 평년은 매일 응답에 들어 있음 |
| 참가격 | 2026-06-12 이후는 API로. 그 전은 채우지 않고 쌓인 만큼만 보여 준다 (`search-first-view` 결정 5) |

---

## 6. 실행 환경 (ADR 0002로 결정)

조건: 당장 비용을 쓰지 않는다. 서비스가 커지면 옮긴다.

### Vercel (화면) + Supabase Free (DB·파일) + GitHub Actions (배치)

```
GitHub Actions (cron) ──수집·정제──▶ Supabase Postgres ◀──읽기── Vercel (apps/web 서버 컴포넌트)
        └──원본 gzip──▶ Supabase Storage
```

| 역할 | 선택 | 무료 조건 | 주의 |
|---|---|---|---|
| DB | Supabase Free | DB 500MB, 파일 1GB, egress 5GB, 무료 프로젝트 2개 (supabase.com/pricing, 2026-10-08 확인) | **1주일 동안 활동이 없으면 일시정지된다.** 매일 도는 배치가 막아 줄 것으로 보이지만, 무엇을 활동으로 치는지 확인해야 한다. **무료 플랜에는 자동 백업이 없다** → ① 원본 파일이 백업 역할 |
| 배치 | GitHub Actions | 공개 저장소는 무료. 비공개 저장소는 월 무료 분량 안에서 | Vercel 크론보다 실행 시간 제한이 넉넉하다 (참가격 457회 호출에 몇 분 걸림). GitHub 서버 → data.go.kr 연결 시간 초과 사례가 있음 (5-3) |
| 화면 | Vercel Hobby | (이 네트워크에서 vercel.com 접속이 차단되어 직접 확인 못 함) | **확인 필요:** Hobby 플랜이 개인·비상업용으로 제한되는지. 광고나 제휴 링크로 수익을 내면 Pro로 바꿔야 할 수 있다 |
| 원본 파일 | Supabase Storage 1GB | 위와 같음 | 약 3년치(추정). 실측 후 보존 기간을 정한다 |

Supabase 프로젝트는 **서울 리전**으로 만든다. data.go.kr과 사용자가 모두 국내에 있기 때문이다 (리전 선택지는 생성 화면에서 확인).

### Railway는 지금은 아니다

docs.railway.com/pricing/plans (2026-10-08 확인) 기준이다.
- Free 플랜은 월 $1 크레딧에 RAM 0.5GB, 볼륨 0.5GB다. Postgres를 항상 켜 두면 RAM 비용만으로 $1를 넘는다 (RAM $10/GB/월).
- 실사용은 Hobby $5/월부터다. $5 사용량이 포함된다.
- 장점은 배치 워커와 Postgres를 한곳에서 돌릴 수 있다는 점이다. 그래서 **옮겨 갈 후보**로 둔다. 서비스가 커져서 GitHub Actions + Supabase Free로 부족해질 때 다시 본다.

### 나중에 옮기기 쉽게 지킬 것

- **DB는 순수 Postgres로만 쓴다.** 테이블, 인덱스, SQL 뷰까지만 쓴다. Supabase Edge Functions나 Supabase 전용 기능에 업무 로직을 넣지 않는다. 그래야 Railway, Neon, RDS 어디로든 `pg_dump`/`pg_restore`로 옮길 수 있다.
- 수집·정제 코드는 실행 환경과 무관한 CLI 하나로 만든다. 예: `ingest --source kamis --date 2026-10-06`. GitHub Actions든 Railway든 크론이 이 명령만 부르게 한다.
- DB 접속 정보는 환경변수 `DATABASE_URL` 하나로 받는다. Storage는 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`로 쓴다 (`ingest-foundation/01`).

---

## 7. 열린 질문

| 질문 | 다룰 곳 |
|---|---|
| 축산 품종의 대표 출처를 축평원과 KAMIS 중 무엇으로 할지 (값이 같음) | ① `ingest-foundation/02` |
| 참가격 점포별 관측값을 DB에 몇 회분 둘지 (용량 실측 후) | ① `ingest-foundation/02` |
| KAMIS 친환경·중도매를 저장할지 (도매는 MVP 이후, E3) | 확장 E3 |
| 평소가 계산식 (KAMIS 5년 평년, 축평원 평년, 최근 N주 중앙값을 섞는 방식) | ② |
| 판정 스냅샷 재계산 주기 (하루 1번 vs 수집 직후마다) | ① `ingest-foundation/05` |
| Vercel Hobby 상업 이용 제한 여부 | ④ (사용자 확인) |
| Supabase Free 일시정지 기준과 수집으로 막을 수 있는지 | ① `ingest-foundation/05` |
| 축평원 D일분 등록 시각 (D일 16:30 이후 ~ D+1 10:10 이전까지만 앎) | ① `p2/03` (실측) |
| 원본 보존 기간 (용량 실측 후) | ① `ingest-foundation/03` |
