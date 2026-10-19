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

추정치다. 실제로 넣어 본 뒤 `pg_total_relation_size`로 다시 잰다. 테이블별 추정과 근거는 [3-9](#3-9-용량-추정과-보관-권장)에 있다 (2026-10-19, 행당 크기를 인덱스까지 넣어 다시 어림했다).

| 데이터 | 행 수 | 행당 크기 (인덱스 포함 추정) | 용량 |
|---|---|---|---|
| 참가격 점포별 관측값을 1년 모두 저장할 때 | 210만~290만 | 150B | 약 320~430MB |
| KAMIS 시장별 관측값을 1년 모두 저장할 때 | 130만 | 150B | 약 200MB (5년 백필 650만 행이면 약 1GB) |
| ③ 집계 (품종 × 규격 × 날짜 × 범위, 5년) | 약 75만 | 90B | 약 70MB |

②를 모두 DB에 넣으면 **1년 안에 500MB를 넘는다.** 그래서 이렇게 나눈다 (권장. 결정은 7장).
- 참가격 점포별 관측값은 **최근 8회 조사(16주)만** DB에 둔다. 그보다 오래된 것은 ③ 집계로만 남기고, 원본은 ① 파일에 있다.
- KAMIS 시장별 관측값은 **최근 90일만** DB에 둔다. 5년 백필도 같은 경로로 넣어 ③을 만든 뒤 90일 밖 행을 지운다. 평년은 ③의 5년 값으로 계산한다.
- 이렇게 하면 DB는 1년차에 약 280~320MB, 그 뒤 연 40~50MB씩 는다. ① 원본 파일은 gzip 기준 1년차 약 250~330MB(백필 포함), 그 뒤 연 130~200MB로 추정되어 Storage 1GB로 약 4~5년을 쓸 수 있다.

---

## 3. 테이블 설계 (논리 스키마)

세 출처의 가격을 같은 모양으로 담는 통합 스키마다 (`p4-canonical-model/01`, 2026-10-19). Postgres 기준으로 쓰고 Supabase 전용 기능에는 기대지 않는다. 나중에 다른 Postgres로 옮길 때 `pg_dump` 한 번이면 되게 하려는 것이다. 실제 DDL·RLS 정책은 `ingest-foundation/02`가 `supabase/migrations/`에 만든다. 아래 SQL 모양의 블록은 설명용 스케치이고 그대로 실행하는 코드가 아니다. 출처별 근거는 출처 문서의 "스키마에 넘길 사실" 절이다 ([kamis.md 13장](sources/kamis.md), [ekape.md 13장](sources/ekape.md), [chamgagyeok.md 14장](sources/chamgagyeok.md), [item-inventory.md 7장](sources/item-inventory.md)).

### 3-0. 공통 규칙

**이름.** 소문자 snake_case, 테이블은 단수형이다. 도메인 용어는 [GLOSSARY.md](../../GLOSSARY.md)의 말을 아래 영어 이름으로 고정한다.

| 용어 | 이름 | 용어 | 이름 |
|---|---|---|---|
| 카테고리 | `category` | 판매처 | `seller` |
| 품목 | `item` | 업태 | `channel` |
| 품종 | `variety` | 점포 | `store` |
| 규격 | `spec` | 조사 시장 | `market` |
| 별칭 | `alias` | 출처 | `source` |
| 상품 | `product` | 시세 | `quote` |
| 기준 단위 | `base_unit` | 판매가 | `shelf_price` |
| 환산 기준 | `g_per_ea` (환산 규칙의 값) | 평년 | `normal_year` |
| 행사 | `promo` | 평소가 · 판정 | `usual_price` · `judgment` |

초안의 `grade`는 `spec`으로 바꿨다. 규격은 등급뿐 아니라 크기·재배 방식도 담기 때문이다. 원천 쪽 이름(KAMIS 품목·품종·등급, 축평원 축종·품목코드)은 우리 용어와 층이 달라서 `source_item.key_parts`에 원천 필드명 그대로 둔다.

**타입.**

| 값 | 타입 | 이유 |
|---|---|---|
| 원천 코드 (`se_cd`, `mrkt_cd`, `itemCd`, `entpId`, `goodId`, AR 코드 …) | `text` | 앞자리 0(`01`, `0110212`)을 지킨다. `entpId`는 `5499990000`처럼 int4를 넘는다 |
| 조사일 | `date` | 세 출처 모두 KST 날짜다 |
| 시각 | `timestamptz` | KAMIS `orgnl_reg_dt`는 UTC(`…Z`), 참가격 `inputDttm`은 시간대 표기가 없는 KST라 `Asia/Seoul`로 해석한다 |
| 원천 가격 | `integer` (원) | 세 출처 모두 정수 원이다. 최대 관측값은 수만 원대다 |
| 계산 가격 (기준 단위 가격, 중앙값, 평소가) | `numeric(12,2)` | 나눗셈 결과다. `float`은 쓰지 않는다 |
| 원천 수량 (`unit_sz`, `goodTotalCnt`) | `numeric` | 지금은 정수만 왔지만 소수가 와도 깨지지 않게 |
| 열거값 (출처, 상태, 시장 유형 …) | `text` + `check` | enum 타입보다 값 추가가 쉽다 |
| 마스터 ID (품종, 상품, 관측 위치 …) | `integer generated always as identity` | 수천 행 규모다. 관측값이 FK 여섯 개를 갖고 있어서 bigint로 하면 행당 24B, 100만 행에 약 24MB가 는다 |
| 계속 쌓이는 기록 ID (원본 파일, 수집 실행, 정정 이력) | `bigint generated always as identity` | 상한이 없다 |
| 3-state 값 (행사 여부) | `boolean null` | `true`/`false`/`null`(모름) |

**없는 값은 `null`.** 출처가 주지 않은 값을 `0`이나 `''`로 채우지 않는다. 특히 행사 필드는 `null`(필드 없음 = 모름)과 `false`(N)가 다르다 ([chamgagyeok.md 3-5](sources/chamgagyeok.md)).

**시각 열 세 가지.** 관측값·평년 행·마스터에 같은 뜻으로 쓴다.

| 열 | 뜻 | 바뀌나 |
|---|---|---|
| `source_registered_at` | 원천이 준 등록 시각. KAMIS `orgnl_reg_dt`(마지막 재등록 시각이라 재등록 때 덮어쓰인다), 참가격 `inputDttm`. 축평원은 필드가 없어 `null` | 원천 값이 바뀌면 따라 바뀐다 |
| `first_seen_at` | 우리가 그 키를 처음 받은 시각 (첫 등록 시각의 대용) | 고정 |
| `last_seen_at` | 마지막으로 받은 응답에서 그 키를 본 시각. 다시 받기마다 갱신 | 갱신 |

조사일 단위로 세는 마스터(상품, 점포, 원천 키)는 같은 뜻을 날짜로 `first_seen_on`·`last_seen_on`에 둔다. 상품의 "최초 확인일·마지막 확인일"이 이것이다.

**키와 인덱스.**
- 원천 자연키는 PK 또는 unique로 둔다. 적재는 `insert … on conflict (자연키) do update`로 한다. 같은 날 다시 받아도 행이 늘지 않는다.
- 관측값·집계는 자연키를 PK로 쓰고 대리키를 두지 않는다. 행당 대리키 8B와 PK 인덱스 약 20B를 아낀다.
- FK 열은 인덱스를 둔다. 생략할 때는 표에 이유를 적는다 (대개 "그 행은 지우지 않는다").
- 삽입 순서와 같이 커지는 열(`obs_date`, `raw_object_id`)은 BRIN 인덱스로 둔다. 몇 KB로 날짜·파일 단위 정리와 재계산을 받친다.
- 기간이 겹치면 안 되는 매핑(`valid_from`~`valid_to`)은 `btree_gist` 확장의 exclusion 제약으로 막는다. 표준 Postgres contrib 확장이라 Supabase 전용이 아니다. 쓰지 않기로 하면 수집 패키지 테스트로 막는다.
- 유효 기간은 `[valid_from, valid_to)`이다. `valid_to`가 `null`이면 현재 유효하다.

**파티셔닝은 처음에 하지 않는다 (권장).** 가장 큰 관측값 표도 보존 규칙(3-9)을 지키면 100만 행 안팎이다. 파티셔닝이 이득인 규모(수천만 행)가 아니고, upsert·제약 관리가 복잡해진다. 대신 관측값 PK에 `obs_date`를 넣어 두어, 나중에 월 단위 range 파티션으로 바꿀 때 키를 바꾸지 않아도 되게 한다. 보존 기간 정리는 주 1회 묶음 `delete`로 한다.

**RLS.** 모든 테이블에 RLS를 켠다. 쓰기는 서비스 롤(GitHub Actions)만 한다. 정책을 두지 않으면 거부이고, 서비스 롤은 RLS를 우회한다. 익명(anon) 읽기는 아래 각 표의 "공개" 열에 ○인 것만 `for select using (true)`로 연다. 정책 안에서 다른 표를 볼 때는 `(select …)`로 감싸 한 번만 계산되게 한다 (3-4 `judgment_snapshot`). 웹앱이 서버 전용 읽기 롤로 읽기로 하면(`ingest-foundation/06`) 익명 정책은 더 줄일 수 있다. 원본 Storage 버킷 `raw`는 비공개, 서비스 롤만이다.

**테이블 목록.**

| 절 | 테이블 | 한 행 | 공개 |
|---|---|---|---|
| 3-1 | `category`, `item`, `variety`, `spec`, `alias` | 카테고리·품목·품종·규격·별칭 | ○ |
| 3-1 | `variety_seasonal_map` | 가격 품종 ↔ 제철 품종 id | ○ |
| 3-1 | `source_code_table` | 출처 코드표의 코드 하나 (종류, 코드) | |
| 3-1 | `source_item` | 원천 키 하나 (KAMIS 구분·부류·품목·품종·등급, 축평원 축종·품목·구분명, 참가격 상품) | |
| 3-1 | `source_code_map` | 원천 키 → 품종·규격, 기간별 | |
| 3-1 | `unit_rule` | 환산 규칙 한 버전 | |
| 3-2 | `region`, `region_code_map` | 우리 지역 코드 / 원천 지역 코드 → 우리 코드 | ○ (`region`) |
| 3-2 | `seller` | 판매처 | ○ |
| 3-2 | `obs_place` | 관측 위치 (점포, 조사 시장, 지역 평균 중 하나) | |
| 3-2 | `store`, `store_link` | 점포 / 점포 재등록·중복 연결 | 후보 (06) |
| 3-2 | `market` | 조사 시장 | |
| 3-2 | `source_master_change` | 마스터 변경 기록 | |
| 3-3 | `observation` | 가격 관측 한 건 | |
| 3-3 | `observation_revision` | 정정 이력 | |
| 3-3 | `reference_observation` | 원천이 준 비교값 (축평원 평년 행) | |
| 3-4 | `daily_quote` | 품종·규격별 일자 요약 | ○ |
| 3-4 | `product_daily_summary` | 상품별 일자 요약 | ○ |
| 3-4 | `reference_price`, `usual_price` | 평년 등 비교값 / 평소가 | ○ |
| 3-4 | `judgment_batch`, `judgment_current`, `judgment_snapshot` | 판정 스냅샷 묶음 / 현재 묶음 포인터 / 품종·규격별 판정 | ○ (현재 묶음만) |
| 3-4 | `calc_param` | 계산 상수 (정해진 값과 ②에서 정할 자리) | |
| 3-5 | `ingest_run`, `source_day`, `source_day_part`, `backfill_task` | 수집 실행 / 출처 × 대상 날짜 상태 / 부분 누락 단위 / 백필 진행 | |
| 3-6 | `product`, `product_source_key`, `product_attr_history`, `product_variety_map`, `al_variety_rule` | 상품 / 출처 키 → 상품 / 상품 속성 이력 / 상품 → 품종 / AL 소분류 → 품종 기본값 | ○ (`product`) |
| 3-7 | `raw_object` | Storage에 올린 원본 파일 하나 | |

### 3-1. 분류와 매핑 (운영자가 관리)

가격 품종 ID(`variety.id`, URL용 `variety.slug`)는 제철 패키지(`packages/seasonal`)의 품종 ID와 **별도 체계**로 둔다. 두 체계는 매핑표 `variety_seasonal_map`으로 잇는다 (2026-10-19 결정). 다대다다. 제철 품종 하나가 가격 품종 여럿(한우 등심, 호주산 등심)에 이어질 수 있다.

```sql
category  id int pk, slug text unique not null, name text not null, sort smallint
item      id int pk, category_id int not null fk category, slug text unique not null, name text not null
variety   id int pk, item_id int not null fk item,
          slug text unique not null,                 -- 가격 품종 ID의 바깥 이름 (URL, payload)
          name text not null,
          base_unit text not null check (base_unit in ('g','ml','ea')),
          base_unit_qty numeric not null,            -- 기준 단위: 100 g, 1 ea, 30 ea(계란) …
          status text not null check (status in ('active','hidden'))
spec      id int pk, variety_id int not null fk variety, slug text not null, name text not null,
          is_default boolean not null, sort smallint,
          unique (variety_id, slug),
          unique (variety_id) where is_default       -- 품종마다 기본 규격 하나
alias     id int pk, text text not null, item_id int null fk, variety_id int null fk,
          check (num_nonnulls(item_id, variety_id) = 1)
variety_seasonal_map  variety_id int fk, seasonal_food_id text,   -- packages/seasonal의 품종 id
          primary key (variety_id, seasonal_food_id)
```

인덱스: `item(category_id)`, `variety(item_id)`, `alias(item_id)`, `alias(variety_id)`, `alias(lower(text))`, `variety_seasonal_map(seasonal_food_id)`. `spec(variety_id)`는 unique가 덮는다.

**코드표.** 출처가 준 코드 목록을 종류와 함께 저장한다. 같은 글자가 종류마다 다르기 때문이다 (참가격 `UT:CS` 캡슐과 `BU:CS` 편의점, 축평원 `itemCd 68`은 돼지 목심이면서 수입 소고기 척아이롤).

```sql
source_code_table
  source text, code_class text, code text, primary key (source, code_class, code)
  name text not null, parent_code text null,       -- 참가격 highCode, KAMIS 품종의 품목
  in_official_table boolean not null,               -- 코드표에 있나 (KAMIS는 응답에만 있는 코드가 온다)
  first_seen_on date, last_seen_on date, retired_on date null, attrs jsonb null
```

| 출처 | `code_class` | `code` 형식 | 예 |
|---|---|---|---|
| KAMIS | `se`, `ctgry`, `item`, `sgg`, `mrkt` | 원천 코드 그대로 | `se:01`, `mrkt:0110212` |
| KAMIS | `vrty` | `{item_cd}-{vrty_cd}` (품목 안에서만 유일) | `vrty:224-01` |
| KAMIS | `grd` | `{item_cd}-{vrty_cd}-{grd_cd}` (축산 `1`~`3`은 품목마다 뜻이 다름) | `grd:224-01-04` |
| 축평원 | `judge_kind`, `item` | `judgeKind` / `{judgeKind}-{itemCd}` | `item:4401-68` |
| 참가격 | `AL`, `UT`, `AR`, `BU` | `classCode`의 코드 | `AR:021800000` |

코드표는 응답으로도 채운다. 처음 보는 코드는 `in_official_table = false`로 넣고 수집을 막지 않는다 ([item-inventory.md 7장](sources/item-inventory.md)).

**원천 키.** 가격 행 하나가 "무엇의 값인지"를 가리키는 원천 키를 등록부에 한 번만 둔다. 관측값은 이 등록부의 `id`만 들고 있어 원천 키 문자열을 행마다 반복하지 않는다.

```sql
source_item
  id int pk
  source text not null check (source in ('kamis','ekape','chamga')),
  source_key text not null,          -- 'kamis:01-200-224-01-04' (구분-부류-품목-품종-등급)
                                     -- 'ekape:4304-27-구분없음'  (축종-품목코드-구분명)
                                     -- 'chamga:1000'             (goodId)
  unique (source, source_key),
  key_parts jsonb not null,          -- {"se_cd":"01","ctgry_cd":"200","item_cd":"224","vrty_cd":"01","grd_cd":"04"}
  label text,                        -- 운영자 화면용 (item_nm/vrty_nm/grd_nm, itemNm/grdNm, goodName)
  first_seen_on date not null, last_seen_on date not null
```

KAMIS 키에 `se_cd`를 넣는다. 구분이 다르면 단위도 다르다. 시장·지역은 원천 키가 아니라 관측 위치(3-2)다.

**원천 키 → 품종·규격 (KAMIS·축평원).** 다대일이고 기간을 가진다. KAMIS 품목 코드가 바뀌고(참다래 `419` → 키위 `437`, 2026-09-01 전후), 배추처럼 작형마다 원천 품종 코드가 바뀌기 때문이다 ([item-inventory.md 7장](sources/item-inventory.md)). 참가격 상품은 상품(3-6)을 거쳐 품종에 이어지므로 이 표를 쓰지 않는다.

```sql
source_code_map
  id int pk
  source_item_id int not null fk source_item,
  valid_from date not null, valid_to date null,
  status text not null check (status in ('pending','mapped','ignored')),
  variety_id int null fk variety, spec_id int null fk spec,
  unit_rule_id int null fk unit_rule,
  role text not null default 'primary' check (role in ('primary','secondary')),  -- 출처 중복 시 대표 여부 (7장)
  note text, updated_at timestamptz,
  check (status <> 'mapped' or (variety_id is not null and spec_id is not null and unit_rule_id is not null)),
  exclude using gist (source_item_id with =, daterange(valid_from, valid_to) with &&)
```

인덱스: `(variety_id, spec_id)`, `(status) where status = 'pending'` (운영자 처리 목록). 원천 키를 처음 본 순간 `pending`으로 자동 등록한다. 매핑이 없는 키도 버리지 않고 ②까지는 저장한다. 나중에 매핑하면 보존 기간 안의 관측값은 DB에서, 그 밖은 원본에서 다시 계산한다.

**환산 규칙.** 기준 단위 가격을 만드는 규칙이다. 행을 고치지 않고 새 버전을 추가한다. 관측값은 계산에 쓴 규칙의 `id`를 남긴다 (`observation.unit_rule_id`). 환산 기준(애호박 1개 ≈ 300g 같은 값)도 규칙의 값으로 두어, 값이 바뀌면 새 버전이 된다.

```sql
unit_rule
  id int pk, rule_code text not null, version smallint not null, unique (rule_code, version),
  price_tier text not null check (price_tier in ('retail','wholesale')),
  kind text not null check (kind in ('same_unit','weight_to_ea','ea_to_weight')),
  params jsonb not null,   -- {"from_unit":"g"} / {"from_unit":"ea","g_per_ea":300} / {"from_unit":"g","g_per_ea":300}
  note text, created_at timestamptz not null
```

계산: `price_per_base = price_raw ÷ (원천 수량을 기준 단위로 바꾼 값) × base_unit_qty`. 예: KAMIS 애호박 `개`·`1` 1,830원 → 1개 1,830원. 참가격 `G`·`110` 1,500원 → 100g당 1,363.64원. 단위가 맞지 않고 환산 기준도 없으면 `null`이다.

**도매 메모.** 도매 시세는 MVP에서 받지 않지만 구조는 열어 둔다. 관측값·집계에 `price_tier`가 있고 환산 규칙도 `price_tier`별이다. 도매는 기준 단위가 소매와 다르다 (배추 `kg(그물망 3포기)`·`10` 대 `포기`·`1`). 도매를 받을 때 품종별 도매 기준 단위와 환산 기준을 정해야 한다. 그때 `variety`에 도매 기준 단위 열을 더하거나 `(variety_id, price_tier)` 표로 뺀다.

### 3-2. 판매처·점포·조사 시장·지역

**관측 위치(`obs_place`).** 가격 행이 "어디의 값인지"를 하나의 키로 가리킨다. 점포(참가격), 조사 시장(KAMIS), 지역 평균(KAMIS 축산 시도·전국, 축평원 전국) 중 하나다. 도메인 용어가 아니라 키를 하나로 만들려는 기술적 표다. 관측값 PK를 `null` 없는 세 열로 만들 수 있고, 점포·조사 시장의 원천 ID가 바뀌지 않는 한 우리 지역 매핑이 바뀌어도 키가 변하지 않는다.

```sql
obs_place
  id int pk
  source text not null,
  kind text not null check (kind in ('store','market','region_avg')),
  source_place_code text not null,   -- 참가격 entpId / KAMIS mrkt_cd / KAMIS 축산 sgg_cd / 축평원 'national'
  unique (source, kind, source_place_code),
  region_code text null fk region,   -- region_code_map으로 붙인 우리 지역 (매핑 전 null)
  first_seen_on date not null, last_seen_on date not null
```

인덱스: `(region_code)`.

**점포(참가격).** `obs_place`의 하위 표다 (PK를 공유).

```sql
store
  place_id int pk fk obs_place,
  name text not null,                     -- entpName
  channel text not null check (channel in ('large_mart','department','ssm','convenience')),  -- BU LM·DP·SM·CS
  region_scope text not null check (region_scope in ('local','national_only')),  -- 편의점 본사 4곳 = national_only
  area_code_raw text, area_detail_code_raw text,   -- AR 원천값 (entpAreaCode, areaDetailCode)
  region_code text null fk region,        -- 우리 시군구 코드 (옛 광주·전남 코드는 새 코드로)
  lat numeric(9,6) null, lng numeric(9,6) null,     -- xMapCoord = 위도, yMapCoord = 경도. 630곳 중 100곳만
  road_addr text null, jibun_addr text null,        -- 재등록 판별 입력
  status text not null check (status in ('active','inactive','superseded')),
  missing_streak smallint not null default 0,       -- 연속으로 0행인 조사일 수 (3이면 inactive)
  lineage_id int not null fk store(place_id)        -- 재등록 사슬의 첫 점포. 집계·추이·점포 수는 이것으로 센다

store_link                                          -- 점포 이력 연결 (재등록, 중복 등록)
  old_place_id int fk store, new_place_id int fk store, primary key (old_place_id, new_place_id),
  reason text not null check (reason in ('re_registered','duplicate')),
  evidence jsonb not null,                          -- 이름(띄어쓰기 무시)·도로명 주소 일치 등
  linked_on date not null, linked_by text not null  -- 'auto' | 운영자

store_seller                                        -- 점포 → 판매처. 운영자 매핑, 기간 있음 (참가격 2단 평균, 판매처 단위 누락·행사)
  place_id int fk store, seller_id int fk seller,
  valid_from date not null, valid_to date null,     -- null = 지금까지
  primary key (place_id, valid_from),
  exclude using gist (place_id with =, daterange(valid_from, valid_to, '[)') with &&)  -- 같은 점포의 기간 겹침 거부
```

- 인덱스: `store_seller(seller_id)`, `store(lineage_id)`, `store(region_code)`, `store_link(new_place_id)`.
- **점포 재등록.** 광주·전남 15곳이 새 `entpId`(2220~2235)와 새 지역 코드로 다시 등록되었다 (예: 신세계백화점광주점 `13` → `2228`, [chamgagyeok.md 7-1](sources/chamgagyeok.md)). 새 점포는 새 `obs_place`·`store` 행이 되고, `store_link(13 → 2228, re_registered)`를 남긴 뒤 새 점포의 `lineage_id`를 옛 점포의 `lineage_id`로 바꾼다. 옛 점포는 `superseded`다. 이름·주소가 같은 동시 등록(GS더프레시 3쌍)은 `duplicate`로 잇는다.
- **판매처 매핑.** `entpName` 앞부분으로 자동 제안하고 운영자가 확정한다. 업태와 함께 정한다 (이마트24(본사)가 이마트로 잘못 묶이지 않게, [chamgagyeok.md 11장](sources/chamgagyeok.md)). **유효 기간을 둔다** (2026-10-20 결정). 판매처가 바뀌면 이전 기간을 닫고 새 기간을 연다. 집계는 조사일이 속한 기간의 판매처로 센다. 그래서 과거 평균은 당시 판매처 기준으로 남는다. 변경은 `source_master_change`에도 남긴다.
- **활동 여부**는 마스터가 아니라 가격 응답의 `obs_place.first_seen_on`·`last_seen_on`과 `missing_streak`로 정한다. 마스터에 있어도 가격이 오지 않는 점포가 184곳이다.

```sql
seller   id int pk, name text unique not null,
         channel text not null check (channel in ('large_mart','department','ssm','convenience','traditional_market','online_mall')),
         note text
```

업태 값은 GLOSSARY 업태(대형마트, 백화점, 기업형 슈퍼, 편의점, 전통시장, 온라인몰)에 맞춘 우리 코드다. 참가격 BU `LM`→`large_mart`, `DP`→`department`, `SM`→`ssm`, `CS`→`convenience`.

**조사 시장(KAMIS).**

```sql
market
  place_id int pk fk obs_place,
  name text not null,                    -- mrkt_nm
  sgg_code_raw text not null,            -- 시장 행의 sgg_cd. 시장이 정한다
  market_type text not null check (market_type in
    ('traditional','large_retail','wholesale','eco_channel','online','other')),
  type_source text not null check (type_source in ('name_rule','operator')),
  in_official_table boolean not null
```

- 시장 유형은 `mrkt_nm` 이름 규칙으로 가르고 결과를 코드에 붙여 저장한다 ([kamis.md 5-1](sources/kamis.md)). `traditional` 실명 전통시장(경동, 부전 …), `large_retail` 익명 대형유통(`X-유통`), `wholesale` 도매시장(`…도매`, 02 중도매), `eco_channel` 07 친환경의 익명 업태 조사처(`A-생협` …), `online` 온라인몰 코드(데이터 없음), `other` 그 밖(`가락소매` `1000006`, 도시 이름만인 코드). 운영자가 고치면 `type_source = 'operator'`다.
- 익명 대형유통은 판매처를 알 수 없다. **판매처로 매핑하지 않는다** (`seller_id` 열이 없다).
- 시장 표는 코드표가 아니라 응답으로 채운다. 코드표에 없는 시장이 온다 (부산 `K-유통` `0210405` 등).
- 축산은 조사 시장이 없다. 시도·전국 평균 행은 `obs_place.kind = 'region_avg'`다.

**지역.** 우리 지역 코드 하나로 세 출처의 지역 코드를 잇는다.

```sql
region
  code text pk,                       -- 우리 코드. 체계는 7장 (제안: 법정동 코드 앞 2·5자리, 전국 '00')
  name text not null,
  level text not null check (level in ('nation','sido','sigungu')),
  parent_code text null fk region,
  valid_from date null, valid_to date null, successor_code text null fk region

region_code_map
  source text, code_class text, source_region_code text, valid_from date,
  primary key (source, code_class, source_region_code, valid_from),
  valid_to date null, region_code text null fk region, note text
```

| 원천 코드 | 예 | 매핑 |
|---|---|---|
| 참가격 AR 시도 (9자리) | `020200000` (구)광주광역시, `021200000` (구)전라남도, `021800000` 전남광주통합특별시 | 옛 코드 둘 다 → 통합 시도 하나. 지역 집계는 새 코드 기준 ([chamgagyeok.md 4-3](sources/chamgagyeok.md)) |
| 참가격 AR 시군구 | 옛 `020201000`, 새 `020201100` | 옛 → 새 시군구. 둘 다 같은 우리 코드 |
| KAMIS `sgg_cd` (4자리) | `1101` 서울, `3111` 수원, `3100` 경기, `1000` 전국, `9998` 온라인 | 시도·시군구로. `1000` → 전국 `00`. `9998`은 지역 없음(`null`, 메모) |
| 축평원 `regionPrc1~17` 번호 | `1` 서울 … `17` 제주 | 시도로 (`code_class = 'region_prc_index'`). MVP는 시도 값을 쓰지 않지만 표는 미리 둔다 |

인덱스: `region(parent_code)`, `region_code_map(region_code)`.

**마스터 변경 기록.** 참가격 마스터는 이력을 주지 않아 월 1회 받아 비교한다 ([chamgagyeok.md 10장](sources/chamgagyeok.md)). 비교에 쓴 원본은 Storage에 날짜별로 남고, 바뀐 것만 행으로 남긴다.

```sql
source_master_change
  id bigint pk, source text, entity text check (entity in ('product','store','code')),
  source_key text not null,           -- goodId / entpId / 'AR:021800000'
  change_kind text check (change_kind in ('added','removed','changed')),
  field text null, old_value text null, new_value text null,
  detected_on date not null, raw_object_id bigint not null fk raw_object,
  action text check (action in ('recorded','mapping_reset','linked','attr_versioned'))
```

인덱스: `(source, entity, source_key)`, `(raw_object_id)`.

### 3-3. ② 관측값

**가격 관측(`observation`)** 은 한 번의 조사에서 나온 가격 한 건이다. 세 출처가 같은 표에 들어간다. 출처에 없는 값은 `null`이다.

```sql
observation
  source_item_id  int  not null fk source_item,   -- 무엇의 값인가 (원천 키)
  obs_date        date not null,                  -- 조사일
  place_id        int  not null fk obs_place,     -- 어디의 값인가 (점포 / 조사 시장 / 지역 평균)
  primary key (source_item_id, obs_date, place_id),

  source          text not null check (source in ('kamis','ekape','chamga')),  -- source_item에서 복사. 출처별 정리·재계산 필터
  price_tier      text not null check (price_tier in ('retail','wholesale')),  -- 가격 단계: 소매 / 도매 (KAMIS se_cd)
  obs_kind        text not null check (obs_kind in ('quote_sample','quote_aggregate','shelf_price')),
                  -- quote_sample 시세 표본 (조사 시장 한 곳의 값, KAMIS 시장 행)
                  -- quote_aggregate 이미 집계된 시세 (KAMIS 축산 시도·전국, 축평원 전국)
                  -- shelf_price 판매가 (점포 한 곳의 개별 관측, 참가격)
  scope           text not null check (scope in ('store','market','sigungu','sido','national')),
  region_code     text null fk region,            -- 위치에서 붙인 우리 지역 (매핑 전 null)
  product_id      int  null fk product,           -- 참가격만 (3-6)
  variety_id      int  null fk variety,           -- 적재 시점의 매핑. 매핑 전이면 null
  spec_id         int  null fk spec,

  price_raw       integer not null check (price_raw > 0),  -- 원천 가격 (원). 참가격 goodPrice는 행사가 반영된 값
  qty_raw         numeric null,                   -- 원천 수량 (KAMIS unit_sz, 축평원 unit의 수량). 참가격은 상품 속성에서
  unit_raw        text null,                      -- 원천 단위 ('개', 'kg(그물망 3포기)', '원/100g')
  price_per_base  numeric(12,2) null,             -- 기준 단위 가격. 환산 실패·매핑 전이면 null
  unit_rule_id    int null fk unit_rule,          -- 환산에 쓴 규칙 버전

  promo_discount      boolean null,               -- 행사(할인): 참가격 goodDcYn Y=true, N=false, 필드 없음=null(모름)
  promo_one_plus_one  boolean null,               -- 행사(1+1): plusoneYn 같은 규칙
  promo_from date null, promo_to date null,       -- goodDcStartDay·EndDay. 표시용 (조사일과 어긋날 수 있다)
  flags           text[] null,                    -- 'carried_over' 'outlier' 'duplicate_of_ekape' 'reloaded' 'unit_mismatch' 'one_plus_one_unverified'

  source_registered_at timestamptz null,          -- 3-0
  first_seen_at   timestamptz not null,
  last_seen_at    timestamptz not null,
  revision        smallint not null default 0,    -- 값이 바뀐 횟수 (정정)
  raw_object_id   bigint not null fk raw_object,  -- 지금 값을 준 원본 파일

  check (obs_kind <> 'shelf_price'     or (scope = 'store' and product_id is not null)),
  check (obs_kind <> 'quote_sample'    or scope = 'market'),
  check (obs_kind <> 'quote_aggregate' or scope in ('sigungu','sido','national'))
```

인덱스:
- PK `(source_item_id, obs_date, place_id)`: upsert, 원천 키별 기간 조회. `source_item_id` FK도 덮는다.
- `(variety_id, spec_id, obs_date) where variety_id is not null`: 품종 재계산.
- `(product_id, obs_date) where product_id is not null`: 상품 화면의 점포별 가격, 상품 요약 재계산.
- BRIN `(obs_date)`: 날짜 단위 재계산, 보존 기간 정리. BRIN `(raw_object_id)`: 원본 하나에서 다시 적재.
- `place_id`, `region_code`, `unit_rule_id` FK 인덱스는 두지 않는다. 그 행들은 지우지 않고, 관측값을 위치·규칙으로 찾는 질의가 MVP에 없다. 100만 행 기준 약 20MB씩을 아낀다.

**원천 자연키 → 관측값 키.**

| 출처 | 원천 자연키 (출처 문서) | `source_item.source_key` | `obs_date` | `place_id` (`obs_place`) |
|---|---|---|---|---|
| KAMIS 시장 행 | (`exmn_ymd`, `se_cd`, `ctgry_cd`, `item_cd`, `vrty_cd`, `grd_cd`, `sgg_cd`, `mrkt_cd`) | `kamis:{se_cd}-{ctgry_cd}-{item_cd}-{vrty_cd}-{grd_cd}` | `exmn_ymd` | `market` / `mrkt_cd`. `sgg_cd`는 시장이 정한다. 시장의 `sgg_code_raw`와 다르면 행을 거부하고 경보 |
| KAMIS 축산 행 | 위와 같음, `mrkt_cd`가 `null` | 위와 같음 | `exmn_ymd` | `region_avg` / `sgg_cd` (`1000` 전국, 시도 코드) |
| 축평원 당일 행 | (`judgeKind`, `itemCd`, `grdNm`, `standYmd`) | `ekape:{judgeKind}-{itemCd}-{grdNm}` | `standYmd` | `region_avg` / `national` |
| 축평원 평년 행 | (`judgeKind`, `itemCd`, `grdNm`, **요청** `standYmd`) | 위와 같음 | 관측값이 아니다 → `reference_observation` | `region_avg` / `national` |
| 참가격 | (`goodInspectDay`, `entpId`, `goodId`) | `chamga:{goodId}` | `goodInspectDay` | `store` / `entpId` |

**적재와 정정.**
- 한 원본 파일의 행을 임시 표에 넣은 뒤, (1) PK가 같고 `price_raw` 또는 행사 열이 다른 행을 `observation_revision`에 옮겨 적고, (2) `insert … on conflict (source_item_id, obs_date, place_id) do update`로 덮는다. 값이 바뀌면 `revision + 1`, `source_day.status = 'corrected'`, 그 날짜의 ③을 다시 계산한다.
- **등록 시각만 바뀐 것은 정정이 아니다.** KAMIS는 값이 같아도 `orgnl_reg_dt`가 바뀐다 (10/06~10/08분 141행, [kamis.md 6-2](sources/kamis.md)). 이때는 `source_registered_at`·`last_seen_at`만 갱신하고 `revision`은 그대로다.
- **보존 기간이 지난 행이 다시 등록되어 오면** (KAMIS 재등록은 최대 249일 뒤) 비교할 관측값이 없다. 관측값에 다시 넣고 `flags += 'reloaded'`, 그 날짜의 `daily_quote`를 다시 계산한다. 집계값이 바뀌면 그날 `source_day`를 `corrected`로 한다. 다시 넣은 행은 다음 보존 정리 때 지운다.

```sql
observation_revision                -- 정정 이력. 바뀌기 전 값을 남긴다
  id bigint pk,
  source_item_id int not null, obs_date date not null, place_id int not null,
                                    -- 관측값 PK. FK는 두지 않는다 (관측값이 보존 기간으로 지워져도 이력은 남긴다)
  revision smallint not null,       -- 바뀐 뒤 번호
  old_price_raw integer, new_price_raw integer,
  old_promo jsonb null, new_promo jsonb null,      -- {"discount":true,"one_plus_one":null,"from":…,"to":…}
  old_source_registered_at timestamptz, new_source_registered_at timestamptz,
  detected_at timestamptz not null, raw_object_id bigint not null fk raw_object
```

인덱스: `(source_item_id, obs_date)`, `(raw_object_id)`.

**평년 행(축평원)은 관측값이 아니다.** 날짜 없이 `standYmd = 평년`으로 오고, 당일 행이 없는 날(오늘, 미래, 휴일)에도 온다 ([ekape.md 4장](sources/ekape.md)). 요청 기준일을 붙여 따로 둔다.

```sql
reference_observation               -- 원천이 준 비교값
  source_item_id int not null fk source_item, ref_date date not null,   -- 요청 standYmd
  place_id int not null fk obs_place,                                    -- 축평원 전국
  ref_type text not null check (ref_type in ('normal_year')),
  primary key (source_item_id, ref_date, place_id, ref_type),
  value_raw integer not null, unit_raw text not null,
  first_seen_at timestamptz not null, last_seen_at timestamptz not null,
  revision smallint not null default 0, raw_object_id bigint not null fk raw_object
```

품종·규격 단위의 비교값은 이것을 매핑해 `reference_price`(3-4)에 만든다. 축평원 수집의 성공 판정은 `resultCode = 00` **그리고** 당일 행 1개 이상이다. 평년 행만 오는 날이 있다 ([ekape.md 13장](sources/ekape.md)).

**출처별 메모.**
- KAMIS 소매 응답의 `mrkt_nm`에는 실명 전통시장과 익명 대형유통("X-유통")이 함께 온다 (배추 14일 샘플: 조사 시장 48곳(코드 기준) 중 실명 16곳, `X-유통` 32곳. 이름 기준으로는 15개·9개. [kamis.md 5-2](sources/kamis.md)). 그래서 신선식품의 **전통시장 대 대형유통** 추이는 KAMIS로 만든다 (`market.market_type`). 참가격에는 전통시장 점포가 없다(630곳 중 0곳).
- 참가격 점포는 새 `entpId`로 다시 등록되기도 한다 (광주·전남 15곳). 관측값은 원천 ID 그대로의 `place_id`로 쌓고, 집계·추이·점포 수는 `store.lineage_id`로 묶는다. 편의점 4곳은 서울 본사라 `region_scope = 'national_only'`이고 지역 집계에서 빼고 전국 집계에만 넣는다 ([chamgagyeok.md 7장·10장](sources/chamgagyeok.md)).
- KAMIS 축산과 축평원은 같은 값이다 (1장). 둘 다 관측값에 넣되, `source_code_map.role`로 대표 출처를 정하고 집계는 대표만 센다. 대표가 아닌 쪽 행은 같은 날 같은 값이면 `flags += 'duplicate_of_ekape'`. 대표 출처는 7장의 열린 결정이다.

### 3-4. ③ 집계·판정

모두 관측값(과 평년 행)에서 언제든 다시 계산하는 **파생 데이터**다. 관측값 보존 기간(3-9)이 지난 날짜는 원본에서 다시 계산한다.

**품종·규격별 일자 요약.**

```sql
daily_quote
  variety_id int fk, spec_id int fk, obs_date date,
  price_tier text check (price_tier in ('retail','wholesale')),
  basis text check (basis in ('quote','shelf_price')),   -- 시세에서 냈나, 판매가에서 냈나
  scope_key text,             -- 'national' | 'market_type:traditional' | 'market_type:large_retail'
                              -- | 'channel:large_mart' … | 'region:<code>'
  primary key (variety_id, spec_id, obs_date, price_tier, basis, scope_key),
  value numeric(12,2) not null,      -- 대표값. 집계된 시세는 원천 값, 시세 표본·판매가는 중앙값
  median numeric(12,2), min numeric(12,2), max numeric(12,2),
  n int not null,                    -- 관측 수 (조사 시장 수, 점포 수(lineage 기준), 지역 평균이면 1)
  n_sellers int null,                -- 판매가일 때 판매처 수
  sources text[] not null,           -- 값을 낸 출처 (대표 출처만)
  promo_excluded_n int not null default 0,   -- 행사(true)라 뺀 관측 수
  stale_days smallint null,          -- 같은 값이 이어진 날 수 (갱신 지연)
  meets_min_n boolean null,          -- 최소 표본 수 기준(②)을 넘었나. 기준이 정해지기 전에는 null
  flags text[] null, calc_version text not null, computed_at timestamptz not null
```

- 인덱스: PK가 품종 화면의 기간 질의(품종 × 규격 × 날짜 범위)를 덮는다. `(obs_date)`: 날짜 단위 재계산.
- 업태별·시장 유형별 `daily_quote`도 **영구 보관**한다. 관측값 보존 기간은 ② 관측값에만 적용된다. 업태별 추이 차트가 이 집계를 읽는다.
- `region:<code>` 범위는 MVP에서 만들지 않는다 (권장, 3-9). 지역 판정이 MVP 범위 밖이고 행 수가 시도 수만큼 는다. 원본이 있어 나중에 만들 수 있다.
- 행사 중(`promo_discount` 또는 `promo_one_plus_one`이 `true`)인 판매가는 `value`·`median`에서 뺀다. `null`(모름)은 빼지 않고 이상치 규칙에 맡긴다 ([chamgagyeok.md 3-5](sources/chamgagyeok.md)).

**상품별 일자 요약.** 검색 화면의 상품 목록·상품 화면이 읽는다. 가격 관측(조사일 × 상품 × 점포) 원본은 쌓기만 하고, 화면은 이 요약을 읽는다. 점포별 가격은 보조 정보다.

```sql
product_daily_summary
  product_id int fk product, obs_date date,
  scope_key text,             -- 'national' | 'channel:<업태>' | 'seller:<seller_id>' | 'region:<code>'
  primary key (product_id, obs_date, scope_key),
  min integer, median numeric(12,2), max integer,
  median_excl_promo numeric(12,2),   -- 행사 제외 중앙값
  seller_avg numeric(12,2),          -- 판매처별 평균을 다시 평균 낸 2단 평균 (정부 화면과 같은 값, search-first-view 결정 4)
  n_stores int not null,             -- lineage 기준 점포 수
  n_sellers int null, promo_n int not null, promo_unknown_n int not null,
  meets_min_n boolean null, computed_at timestamptz not null
```

`region:<code>` 범위는 처음에는 시도까지만 둔다. 편의점 본사(`national_only`)는 `national`과 `channel:convenience`에만 들어간다. 상품 → 품종 연결과 무관하게 만든다 (가공식품 품종 단위가 정해지기 전에도 상품 화면은 돈다).

**평년·평소가.**

```sql
reference_price             -- 품종·규격 단위 비교값
  variety_id, spec_id, ref_date date, ref_type text check (ref_type in ('normal_year','year_ago','month_ago')),
  source text check (source in ('ekape','computed')),   -- 축평원 평년(응답) / KAMIS 5년 이력으로 계산
  scope_key text,
  primary key (variety_id, spec_id, ref_date, ref_type, source, scope_key),
  value numeric(12,2) not null, method text not null, computed_at timestamptz not null

usual_price                 -- 평소가 (계산식은 로드맵 ②)
  variety_id, spec_id, as_of date, primary key (variety_id, spec_id, as_of),
  value numeric(12,2) not null, method text not null, components jsonb not null, confidence smallint
```

**판정 스냅샷.** 새 계산이 모두 성공했을 때만 바꾼다. 재계산이 실패하면 직전 스냅샷이 그대로 남는다. 한 묶음을 다 만든 뒤 포인터 한 줄을 바꾸는 방식으로, 읽는 쪽은 반쯤 만든 묶음을 볼 수 없다.

```sql
judgment_batch     id bigint pk, started_at, finished_at null,
                   status text check (status in ('building','ready','failed')), trigger text, note text
judgment_current   singleton boolean pk default true check (singleton),   -- 한 줄짜리 포인터
                   batch_id bigint not null fk judgment_batch, swapped_at timestamptz
judgment_snapshot  batch_id bigint fk judgment_batch on delete cascade, variety_id int fk, spec_id int fk,
                   primary key (batch_id, variety_id, spec_id),
                   as_of date, today_price numeric(12,2), usual numeric(12,2),
                   verdict text check (verdict in ('cheap','normal','expensive')),
                   diff_pct numeric(6,2), confidence smallint,
                   payload jsonb not null      -- 4-1 모양 그대로
```

1. `judgment_batch`를 `building`으로 만들고 모든 품종·규격의 행을 넣는다.
2. 행 수와 필수 값을 검사한다.
3. 한 트랜잭션에서 묶음을 `ready`로, `judgment_current.batch_id`를 새 묶음으로 바꾼다.
4. 1~3 중 실패하면 묶음을 `failed`로 남기고 포인터는 그대로 둔다. `ready` 묶음은 최근 3개만 두고 나머지는 지운다.

익명 읽기 정책은 현재 묶음만 연다: `using (batch_id = (select batch_id from judgment_current))`.

**계산 상수.** 판정 설계(②)에서 정할 값의 자리를 미리 둔다. 계산 코드는 상수를 이 표에서 읽고, 결과 행의 `calc_version`에 쓴 값을 남긴다.

```sql
calc_param   key text pk, value jsonb null,
             status text check (status in ('decided','placeholder')), decided_in text, note text
```

| `key` | 값 | 상태 | 근거 |
|---|---|---|---|
| `chamga.disappear_streak` | `3` | decided | 연속 3개 조사일 결측이면 "조사 안 됨" ([chamgagyeok.md 9장](sources/chamgagyeok.md)) |
| `chamga.partial.day_ratio` · `seller_ratio` · `store_ratio` | `0.8` · `0.5` · `0.5` | decided | 같은 곳 9장 |
| `kamis.partial.item_ratio` | `0.5` | decided | 5-2 "일부만 옴" |
| `aggregate.min_n` (범위별 최소 표본 수) | `null` | placeholder | ② 판정 설계. 정해지면 `meets_min_n`을 채운다 |
| `kamis.carried_over_days`, `ekape.carried_over_days` | `null` | placeholder | ② ([kamis.md 6-4](sources/kamis.md), [ekape.md 9장](sources/ekape.md)) |
| `outlier.day_over_day`, `outlier.vs_median` | `0.5`, `3` | placeholder | 5-2 이상치. ②에서 다시 본다 |

### 3-5. 수집 상태 (장애 대응의 핵심)

```sql
ingest_run
  id bigint pk, source text,
  job text check (job in ('daily','recheck','reregistration_watch','master','backfill','recompute')),
  started_at timestamptz not null, finished_at timestamptz null,
  status text check (status in ('running','ok','partial','failed')),
  calls_used int not null default 0, call_budget int not null,
  error_code text null, error_detail text null,   -- 인증키·원천 오류 문구(ORA-… 등)는 남기지 않는다
  git_sha text

source_day                              -- 출처 × 대상 날짜(조사일)마다 한 줄
  source text, target_date date, primary key (source, target_date),
  status text not null check (status in
    ('pending','ok','partial','empty_expected','empty_unexpected','failed','corrected')),
  expected_rows int null,               -- 기준 행 수 (KAMIS 최근 4주 같은 요일 중앙값, 참가격 최근 4 조사일 중앙값)
  row_count int not null default 0, item_count int null, place_count int null,
  attempts smallint not null default 0,
  first_ok_at timestamptz null,         -- 처음 정상으로 받은 시각 (도착 시각 측정)
  last_checked_at timestamptz null, last_changed_at timestamptz null,
  max_source_registered_at timestamptz null,   -- KAMIS orgnl_reg_dt 최대, 참가격 inputDttm 최대
  stable_checks smallint not null default 0,   -- 행 수가 연속으로 같았던 횟수 (참가격 완료 판단)
  closed_at timestamptz null,           -- 더 다시 받지 않기로 한 시각 (참가격: 금요일 뒤 10일, 완료 후 다음 주 월요일)
  last_error_code text null, checksum text null, note text null

source_day_part                         -- 부분 누락을 판정하는 단위
  source text, target_date date,
  part_kind text check (part_kind in ('item','seller','store','fresh_panel')),
  part_key text,                        -- KAMIS item_cd / seller_id / entpId / 'chamga-fresh-9'
  primary key (source, target_date, part_kind, part_key),
  row_count int not null, baseline int null,
  status text check (status in ('ok','partial','missing'))

backfill_task                           -- 과거분 채우기 진행 (중간에 끊겨도 이어 받는다)
  source text, task_key text,           -- 'kamis:01-211:2023', 'ekape:4304:2024-03-01'
  primary key (source, task_key),
  status text check (status in ('pending','running','done','failed')),
  rows int null, calls int null, finished_at timestamptz null, last_error_code text null
```

- `source_day`는 출처 × 날짜마다 한 줄이다. 배치는 매번 이 표를 보고 **비어 있거나 실패한 날짜를 다시 채운다.** 마지막으로 성공한 날짜 하나만 기억하는 방식은 쓰지 않는다. 중간에 빠진 날을 놓치기 때문이다.
- 상태의 뜻: `pending` 아직 안 옴 | `ok` | `partial` 일부 누락 | `empty_expected` 휴일·격주 비는 날·확인된 조사 없음 | `empty_unexpected` 와야 하는데 없음 | `failed` 호출 실패 | `corrected` 받은 뒤 값이 바뀜. 판정 기준은 5-2.
- `source_day_part`의 `store` 행이 `partial`인 조사일은 상품 사라짐 횟수(`product.missing_streak`)에 세지 않는다. `fresh_panel`은 일반 신선식품 9개 점포 표본이다 ([chamgagyeok.md 9장](sources/chamgagyeok.md)).
- 인덱스: `ingest_run(source, started_at)`, `source_day(status) where status not in ('ok','empty_expected')`.

### 3-6. 상품 (참가격)

상품 중심 검색을 위한 구조다 (2026-10-12 논의). 상품 ID는 **참가격(그리고 나중의 제보, 온라인몰)용**이다. KAMIS·축평원은 상품 ID가 없고 품종·규격 단위 시세를 주므로 상품이 아니라 품종·규격에 이어진다(`source_code_map`). 한 ID로 세 출처를 통합하는 구조가 아니다.

```sql
product                            -- 우리가 발급하는 상품 ID
  id int pk,                       -- identity. 재사용하지 않는다. 지우지 않는다
  name text not null,              -- 현재 이름 (속성 이력의 최신 값을 복사)
  status text not null check (status in ('surveyed','not_surveyed')),   -- 조사 중 / 조사 안 됨
  first_seen_on date not null,     -- 최초 확인일 (처음 가격이 관측된 조사일)
  last_seen_on date null,          -- 마지막 확인일
  missing_streak smallint not null default 0,   -- 연속 결측 조사일 수 (partial 조사일은 세지 않음)
  status_changed_on date null

product_source_key                 -- (출처, 출처 키, 유효 시작일, 유효 종료일) → 상품
  source_item_id int not null fk source_item,   -- 'chamga:<goodId>'
  valid_from date not null, valid_to date null,
  product_id int not null fk product,
  primary key (source_item_id, valid_from),
  exclude using gist (source_item_id with =, daterange(valid_from, valid_to) with &&)

product_attr_history               -- (상품, 유효 시작일) → 이름·용량·분류
  product_id int fk product, valid_from date, valid_to date null,
  primary key (product_id, valid_from),
  name text not null,              -- goodName
  total_qty numeric not null,      -- goodTotalCnt
  total_unit text not null,        -- goodTotalDivCode (UT 코드)
  al_code text not null,           -- goodSmlclsCode (AL 소분류)
  maker_code text null,            -- productEntpCode. 이름은 API에 없다 (p2/06 미결)
  detail_mean text null,           -- 환산 기준·규격 판별 근거. 운영자가 읽는다
  raw_object_id bigint not null fk raw_object

product_variety_map                -- 상품 → 품종·규격 (기간별)
  product_id int fk product, valid_from date, valid_to date null,
  primary key (product_id, valid_from),
  status text check (status in ('pending','mapped','ignored')),
  variety_id int null fk variety, spec_id int null fk spec, unit_rule_id int null fk unit_rule,
  origin text check (origin in ('al_rule','operator')),
  exclude using gist (product_id with =, daterange(valid_from, valid_to) with &&)

al_variety_rule                    -- AL 소분류 → 품종 기본값 (search-first-view 결정 8)
  al_code text pk, variety_id int not null fk variety, spec_id int null fk spec,
  unit_rule_id int not null fk unit_rule, note text
```

- 인덱스: `product_source_key(product_id)`, `product_attr_history(raw_object_id)`, `product_variety_map(variety_id, spec_id)`, `al_variety_rule(variety_id)`.
- 가격 관측·요약·URL은 **상품 내부 ID만 참조**한다. 출처 키(`goodId`)를 URL에 노출하지 않는다. 바깥 ID 형식은 로드맵 ③④에서 정한다.
- 상품 → 품종은 소분류 규칙(`al_variety_rule`)으로 먼저 채우고(`origin = 'al_rule'`) 맞지 않는 상품만 운영자가 고친다(`operator`). 가공식품의 품종 단위는 `p3-variety-catalog/01`이 정한다. 그 전에는 `pending`이고 관측값의 `variety_id`는 `null`이다.
- **새 출처 키가 나타나면** 새 `product`와 `product_source_key`를 만든다. "기존 상품의 이름·용량 변경"인지 가르는 기준은 마스터 변경 사례를 몇 달 쌓은 뒤 정한다 (7장). 그 전에는 운영자가 두 상품을 하나로 보기로 하면 `product_source_key`의 `product_id`를 기존 상품으로 바꾼다.
- **`goodId` 재사용 의심**(소분류가 바뀌거나 이름과 용량이 함께 바뀜)이면 그 키의 현재 `product_source_key`에 `valid_to`를 넣어 끊고, 운영자가 새 상품인지 정한다. 이름만 조금 바뀐 것은 `product_attr_history`에 새 행을 넣고 상품은 그대로다. 그래서 이름이 바뀌어도 과거 가격이 같은 상품으로 이어진다.
- **사라짐·추가.** 사라진 상품은 지우지 않고 `not_surveyed`와 마지막 확인일로 표시하며 과거 추이를 계속 보인다. 판정은 보수적으로 한다. 조사일마다 그 상품을 낸 점포가 0곳이면 `missing_streak + 1`, 하나라도 있으면 0으로 되돌리고 `surveyed`. `missing_streak`가 `calc_param chamga.disappear_streak`(=3)에 닿으면 `not_surveyed`. 조사일 전체가 `partial`이거나 그 상품을 내던 점포가 `partial`인 날은 세지 않는다 (점포 100의 2026-08-07 상품 258개 누락이 이런 날이다). 새 상품은 `first_seen_on`을 넣고, 가격이 쌓이기 전에는 화면이 "가격을 모으는 중"으로 보인다.

### 3-7. ① 원본 보관 레코드

원문은 Supabase Storage(`raw` 버킷)에 gzip NDJSON으로 두고, DB에는 파일 하나마다 한 줄을 둔다. 관측값은 `raw_object_id`로 자기 값을 준 파일을 가리킨다.

```sql
raw_object
  id bigint pk,
  source text not null,
  endpoint text not null,          -- 'perDay/price' | 'consumerPriceDaily' | 'getProductPriceInfoSvc'
                                   -- | 'getStoreInfoSvc.do' | 'getProductInfoSvc.do' | 'getStandardInfoSvc.do'
  storage_path text unique not null,   -- raw/{source}/{YYYY}/{MM}/{DD}/{call-key}.ndjson.gz (DD = KST 수집일)
  requests jsonb not null,         -- 호출마다 파라미터(serviceKey 제외), pageNo, HTTP 상태, resultCode, 행 수
  call_count smallint not null, row_count int not null, bytes_gz int not null,
  content_sha256 text not null,
  target_from date null, target_to date null,   -- 담긴 조사일 범위
  fetched_at timestamptz not null, ingest_run_id bigint not null fk ingest_run,
  contract_baseline text not null, -- 계약 테스트 baseline 버전 (p2/12). 응답 모양이 baseline과 같은지 본 기준
  adapter_version text not null,   -- 이 파일을 ②로 바꾼 어댑터 버전
  load_status text not null check (load_status in
    ('pending_load','loaded','partially_rejected','rejected','duplicate')),
  rejected_rows int not null default 0,     -- 행 단위 검증에서 ②로 못 넘긴 행 수
  duplicate_of bigint null fk raw_object,   -- 직전 파일과 해시가 같아 올리지 않았을 때
  loaded_at timestamptz null
```

- 인덱스: `(source, target_from)`, `(ingest_run_id)`, `(load_status) where load_status = 'pending_load'`, `(duplicate_of)`.
- 순서: Storage에 먼저 올리고 `pending_load`로 기록한 뒤 적재한다. DB 적재가 실패하면 다음 실행이 `pending_load` 파일을 다시 적재한다 (5-2 "DB에 연결 못 함"). Storage 업로드 전에 DB가 안 되면 실행 로컬에 남긴 기록으로 다음 실행이 `raw_object` 행을 채운다.
- 파일 단위는 **실행 × 기능 × 대상 날짜 묶음 하나**로 한다 (권장). 호출마다 파일을 만들면 참가격 조사일 하나에 457개, 1년 약 16만 줄이 된다. 묶으면 하루 몇 줄이다. `call-key`는 이 묶음 키다 (`ingest-foundation/03`).
- 같은 대상을 다시 받았는데 내용 해시가 직전 파일과 같으면 올리지 않고 `duplicate`로 기록만 한다 (참가격 다시 받기, 축평원 D-2·D-3). 원본 용량을 크게 줄인다 (3-9).

### 3-8. 확장: 제보와 온라인몰

둘 다 확장 단계(E1 온라인몰, E2 제보)이고 지금 설계하지 않는다. 같은 레코드에 담을 수 있는지만 확인했다. 막히는 곳은 없다.

| | 들어갈 곳 | 필요한 변경 |
|---|---|---|
| 온라인몰 | `source_item` = 몰 상품 ID → `product_source_key` → `product`. 같은 물건이면 참가격 상품과 같은 상품 ID로 묶을 수 있다. `obs_place.kind`에 `'online'`, 판매처는 `seller.channel = 'online_mall'`. `obs_kind = 'shelf_price'` | `source`·`obs_place.kind`·`scope`의 check 값 추가. 표 구조는 그대로 |
| 제보 | 입력·검수·이상 제보 판정은 별도 표(`price_report`, E2)에 둔다. 공개된 제보만 관측값으로 옮긴다: `source = 'report'`, `source_item` = `report:product:<id>` 또는 `report:variety:<id>-<spec>`, `place_id` = 점포 또는 지역, `obs_kind = 'shelf_price'` | 같은 날 같은 점포·상품의 제보가 여럿이면 PK가 하나라 대표값(중앙값) 1건만 넣고, 건수는 `price_report`에서 센다. `shelf_price`의 `product_id not null` 검사는 품종 제보를 위해 `source <> 'report'` 조건을 더한다 |

### 3-9. 용량 추정과 보관 권장

**추정이다.** 행당 크기는 Postgres 행 머리(약 24B) + 열 + 인덱스로 어림했다. 실제로 넣어 본 뒤 `pg_total_relation_size`로 다시 잰다 (`ingest-foundation/02`·`05`). 행 수는 출처 문서의 실측에서 왔다. Supabase Free DB 500MB에는 시스템 스키마 몫(수십 MB)도 들어 있다.

행 수 근거:
- KAMIS 소매: 평일 하루 약 5,223행(축산 포함), 연 약 242 조사일. 축산은 주말에도 하루 약 470행(소 264, 돼지 72, 계란 71, 닭 47, 우유 18). 1년 약 130만 행. **5년 백필은 약 650만 행**이다 (축산 외 품목당 6만~10만, 소 43.7만, 돼지 12만. [kamis.md 8장](sources/kamis.md)).
- 축평원: 하루 당일 27 + 평년 27행. 1년 약 1만 + 1만. 5년 백필 5만 + 5만 ([ekape.md 11장](sources/ekape.md)).
- 참가격: 조사일당 식품 약 8만~11만 행 (활동 점포 약 450곳 × 식품 약 200~250개), 연 26 조사일. 1년 약 210만~290만 행.

| 테이블 | 행 수 | 행당 (인덱스 포함) | 용량 | 보관 (권장) |
|---|---|---|---|---|
| `observation` KAMIS (시장·축산) | 90일분 약 34만 | 약 150B | **약 50MB** | 최근 90일만. 1년을 모두 두면 약 200MB, 5년이면 약 1GB라 DB에 둘 수 없다 |
| `observation` 참가격 | 8 조사일분 약 65만~90만 | 약 150B | **약 100~135MB** | 최근 8 조사일(약 16주). 1년을 모두 두면 약 320~430MB (7장 열린 결정) |
| `observation` 축평원 | 5년 약 5만 (+1만/년) | 약 150B | 약 8MB (+1.5MB/년) | 영구 (작다) |
| `reference_observation` | 5년 약 5만 (+1만/년) | 약 100B | 약 5MB | 영구 |
| `daily_quote` | 5년 약 75만 (+15만/년) | 약 90B | **약 70MB** (+14MB/년) | 영구. 범위는 `national` + 시장 유형 2개 + 업태(판매가). 시도 범위를 더하면 축산만으로 연 +20만 행 |
| `product_daily_summary` | 연 약 10만 (상품 457 × 범위 약 8 × 26) | 약 100B | 약 10MB/년 | 영구 |
| `reference_price` | 연 약 16만 (품종·규격 약 220 × 365 × 2종) | 약 80B | 약 13MB/년 | 영구. 화면에 필요한 날짜만 두면 더 준다 |
| `usual_price`, `judgment_*` | 판정 묶음 3개 × 약 220행, payload 약 3KB (압축) | | 약 3MB | 묶음 3개 |
| `observation_revision` | 드묾 (10-19까지 가격 정정 0건) | 약 120B | 1MB 미만 | 영구 |
| 마스터 (`source_item` 약 1,400, `obs_place` 약 900, `product` 604, 코드표 약 1,600, 지역 약 400 …) | 수천 | | 5MB 미만 | 영구 |
| 수집 상태 (`source_day`, `source_day_part`, `ingest_run`, `raw_object`) | 연 약 4만 | 약 100B | 약 4MB/년 | 영구 (2년 넘은 `source_day_part`는 지워도 된다) |
| **합계 (1년차)** | | | **약 280~320MB** | 이후 연 +40~50MB |

원본 파일 (Storage 1GB). 저장 샘플을 gzip으로 재 보니 행당 KAMIS 약 12B(배추 14일 381행 151KB → 4.7KB), 참가격 약 7~8B(419행 114KB → 3.3KB)였다. 다른 품목이 섞이면 압축률이 조금 낮아질 것으로 보고 KAMIS 15B, 참가격 10B로 어림한다.

| 원본 | 1년차 | 이후 매년 |
|---|---|---|
| KAMIS 5년 백필 (650만 행) | 약 100MB (1회) | - |
| KAMIS 매일 (D-3~D-1 기간 호출이라 같은 날을 세 번 받는다) + 재등록 감시 | 약 70~90MB | 같음 |
| 축평원 5년 백필 + 매일 | 약 25MB + 7MB | 7MB |
| 참가격 (조사일당 약 1MB × 다시 받기 2~4회 × 26) | 약 50~100MB. 해시가 같은 다시 받기를 올리지 않으면 절반 아래 | 같음 |
| 마스터 월 1회 | 5MB 미만 | 같음 |
| **합계** | **약 250~330MB** | **약 130~200MB** |

1GB로 약 4~5년이다. 2장의 "연 200~300MB, 약 3년" 추정보다 여유가 있다.

**보관·집계 권장 (결정은 `ingest-foundation/02`·`03`, 7장).**
1. KAMIS 시장·축산 관측값은 DB에 **최근 90일**만 둔다. 5년 백필은 품목 × 연도 단위로 관측값에 넣고 `daily_quote`를 만든 뒤 90일 밖 행을 바로 지운다. 평년은 `daily_quote`의 5년 전국·시장 유형 값으로 계산한다. 정기 수집과 같은 경로라 코드가 하나다.
2. 참가격 점포별 관측값은 DB에 **최근 8 조사일**만 둔다. 사라짐 판정(N=3)과 판매처 누락 판정(최근 4 조사일 중앙값)에 필요한 것보다 넉넉하고, 상품 화면의 "최근 몇 회 점포별 가격"을 받친다. 그보다 오래된 것은 `product_daily_summary`·`daily_quote`로만 남는다. 실측 용량이 크면 6회로 줄인다.
3. 축평원 관측값과 평년 행은 영구 보관한다.
4. 집계(`daily_quote`, `product_daily_summary`)는 영구 보관하되 `region:` 범위는 MVP에서 만들지 않는다.
5. 원본: **KAMIS·축평원은 다시 받을 수 있으므로** 1년이 지난 원본을 지워도 된다 (백필 원본 포함). **참가격은 과거를 다시 주지 않을 수 있으므로 원본을 지우지 않는다** (2026-06-12 이전은 이미 받을 수 없다). 같은 내용의 다시 받기는 올리지 않는다 (3-7).
6. 보존 정리는 주 1회 묶음 `delete`로 하고 autovacuum에 맡긴다. 관측값이 수백만 행을 넘게 되면 월 단위 파티션으로 바꾸고 `drop partition`으로 정리한다.

### 3-10. 예시: 실제 샘플 한 건씩 넣어 보기

[samples/](../../reference/public-data/samples/)의 저장 응답(2026-10-12T02:27:09Z 호출, `manifest.tsv`)에서 한 건씩 가져왔다. 품종 slug, 우리 지역 코드(7장 제안 체계), 내부 ID 숫자는 예시다.

원천 행:

| 출처 | 파일 | 원천 행 (필요한 필드만) |
|---|---|---|
| KAMIS | `kamis/vegetable-aehobak-retail.json` 첫 행 | `exmn_ymd 20260928`, `se_cd 01`, `ctgry_cd 200`, `item_cd 224` 호박, `vrty_cd 01` 애호박, `grd_cd 04` 상품, `sgg_cd 1101` 서울, `mrkt_cd 0110212` 경동, `unit 개`, `unit_sz 1`, `exmn_dd_prc 1830`, `exmn_dd_cnvs_prc 1830`, `orgnl_reg_dt 2026-09-28T15:06:40Z` |
| 축평원 | `ekape/pork-samgyeopsal.xml` (요청 `standYmd=20261011`) | 당일 행: `standYmd 20261011`, `judgeKind 4304` 돼지, `itemCd 27` 삼겹살, `grdNm 구분없음`, `ntslPrc 2985`, `maxPrc 3168`, `minPrc 2848`, `regionPrc1~17`, `unit 원/100g`. 평년 행: `standYmd 평년`, `ntslPrc 2721` |
| 참가격 | `chamgagyeok/price-by-good-1000.xml` (요청 `goodInspectDay=20260925&goodId=1000`) | `goodInspectDay 20260925`, `entpId 682`, `goodId 1000`, `goodPrice 1500`, `plusoneYn N`, `goodDcYn N`, `inputDttm 2026-09-23 14:06:47`. 상품 마스터(`product-1000.xml`): `팔도 왕뚜껑(110g)`, `goodTotalCnt 110`, `goodTotalDivCode G`, `goodSmlclsCode 030201024` 컵라면, `productEntpCode 1819`. 점포 마스터(`store-all.xml`): `신세계백화점센텀시티점`, `DP`, `020500000` 부산, `020504000` 해운대구, 좌표 없음 |

적재 전에 생기는 마스터 행:

| 표 | KAMIS | 축평원 | 참가격 |
|---|---|---|---|
| `source_item` | `kamis:01-200-224-01-04`, label `호박/애호박/상품` | `ekape:4304-27-구분없음`, label `돼지/삼겹살/구분없음` | `chamga:1000`, label `팔도 왕뚜껑(110g)` |
| 매핑 | `source_code_map`: → 품종 `aehobak`(기준 단위 1 ea), 규격 상품(기본), `unit_rule same_unit v1`, `mapped` | `source_code_map`: → 품종 `pork-belly-kr`(100 g), 규격 기본, `unit_rule same_unit v1`, `mapped`, `role` = 7장 결정 | `product` #1 → `product_source_key(chamga:1000, 2026-06-12~)`. `product_attr_history`: 이름·`110`·`G`·`030201024`·`1819`. `product_variety_map`: AL `030201024` 컵라면의 품종 단위가 아직 없어 `pending` |
| `obs_place` | `market` / `0110212`, region `11` | `region_avg` / `national`, region `00` | `store` / `682`, region `26350` |
| 하위 표 | `market`: 경동, `sgg_code_raw 1101`, `traditional` (`name_rule`) | - | `store`: 신세계백화점센텀시티점, `department`, 판매처 신세계백화점, `local`, AR `020500000`·`020504000`, 좌표 `null`, 도로명 `부산광역시 해운대구 센텀남대로 35`, `lineage_id` = 자기 |

`observation` 한 줄:

| 열 | KAMIS | 축평원 | 참가격 |
|---|---|---|---|
| `source_item_id` | `kamis:01-200-224-01-04`의 id | `ekape:4304-27-구분없음`의 id | `chamga:1000`의 id |
| `obs_date` | 2026-09-28 | 2026-10-11 | 2026-09-25 |
| `place_id` | 시장 `0110212`의 id | `ekape` 전국의 id | 점포 `682`의 id |
| `source` | `kamis` | `ekape` | `chamga` |
| `price_tier` | `retail` (`se_cd 01`) | `retail` | `retail` |
| `obs_kind` | `quote_sample` | `quote_aggregate` | `shelf_price` |
| `scope` | `market` | `national` | `store` |
| `region_code` | `11` | `00` | `26350` |
| `product_id` | `null` | `null` | 1 |
| `variety_id` / `spec_id` | 애호박 / 상품 | 국산 삼겹살 / 기본 | `null` / `null` (매핑 `pending`) |
| `price_raw` | 1830 | 2985 | 1500 |
| `qty_raw` / `unit_raw` | 1 / `개` | 100 / `원/100g` | `null` / `null` (상품 속성: 110 `G`) |
| `price_per_base` | 1830.00 (1개당) | 2985.00 (100g당) | `null`. 기준 단위가 100g인 품종에 이어지면 1500 ÷ 110 × 100 = 1363.64 |
| `unit_rule_id` | `same_unit v1` | `same_unit v1` | `null` |
| `promo_discount` / `promo_one_plus_one` | `null` / `null` (출처에 행사 정보 없음) | `null` / `null` | `false` / `false` (N, N) |
| `promo_from` / `promo_to` | `null` | `null` | `null` |
| `flags` | `null` | `null` (KAMIS 같은 날 행이 오면 그쪽에 `duplicate_of_ekape`) | `null` |
| `source_registered_at` | 2026-09-28 15:06:40+00 (KST 09-29 00:06) | `null` | 2026-09-23 14:06:47+09 |
| `first_seen_at` = `last_seen_at` | 2026-10-12 02:27:09+00 | 2026-10-12 02:27:09+00 | 2026-10-12 02:27:09+00 |
| `revision` | 0 | 0 | 0 |
| `raw_object_id` | `raw/kamis/2026/10/12/…` 파일 | `raw/ekape/2026/10/12/…` | `raw/chamga/2026/10/12/…` |
| ②에 넣지 않는 필드 (원본에만) | `ctgry_nm`, `item_nm`, `vrty_nm`, `grd_nm`, `se_nm`, `sgg_nm`, `mrkt_nm`(시장 표로), `exmn_dd_cnvs_prc` | `judgeKindNm`, `itemNm`, `maxPrc`, `minPrc`, `regionPrc1~17` | `goodBaseCnt`, `goodUnitDivCode` (상품 마스터) |

축평원 평년 행은 `reference_observation(ekape:4304-27-구분없음, ref_date 2026-10-11, 전국, normal_year, value_raw 2721, unit_raw 원/100g)`이 된다. 관측값에는 들어가지 않는다.

### 3-11. 출처별 변환 규칙 요약

필드마다 한 줄이다. 세부(경계값, 오류 처리)는 수집 패키지의 어댑터 테스트가 기준이다 (`p4/03`, 별도 `adapters.md`는 만들지 않는다).

| 통합 필드 | KAMIS (`perDay/price`) | 축평원 (`consumerPriceDaily`) | 참가격 (`getProductPriceInfoSvc`) |
|---|---|---|---|
| `source_item` 키 | `{se_cd}-{ctgry_cd}-{item_cd}-{vrty_cd}-{grd_cd}` | `{judgeKind}-{itemCd}-{grdNm}` (`itemCd`는 축종 안에서만 유일) | `{goodId}` |
| `obs_date` | `exmn_ymd` → date | `standYmd`(날짜일 때) → date. `평년`이면 → `reference_observation.ref_date` = 요청 `standYmd` | `goodInspectDay` → date (항상 금요일) |
| `place_id` | `mrkt_cd`가 있으면 시장, `null`이면 `sgg_cd` 지역 평균 | 전국 (`national`) | `entpId` 점포 |
| `scope` | 시장 `market` / 축산 `1000` → `national`, 시도 코드 → `sido` | `national` | `store` |
| `region_code` | 시장의 `sgg_code_raw` 또는 축산 `sgg_cd` → `region_code_map` | `00` 전국 | 점포의 `areaDetailCode` → `region_code_map` (옛 광주·전남 → 새 코드) |
| `price_tier` | `se_cd` `01`·`07` → `retail`, `02` → `wholesale` (MVP는 `01`만 받음) | `retail` | `retail` |
| `obs_kind` | 시장 행 `quote_sample`, 축산 행 `quote_aggregate` | `quote_aggregate` | `shelf_price` |
| `price_raw` | `exmn_dd_prc` → integer | `ntslPrc` → integer | `goodPrice` → integer (행사 반영가) |
| `qty_raw` · `unit_raw` | `unit_sz` → numeric · `unit` 그대로 | `unit`(`원/100g`)에서 수량 100 · `unit` 그대로 | `null` · `null` (상품 속성의 `goodTotalCnt`·`goodTotalDivCode` 사용) |
| `price_per_base` | `price_raw ÷ (unit_sz를 기준 단위로) × base_unit_qty`. `exmn_dd_cnvs_prc`는 쓰지 않는다 | 축종별 고정 단위(100g, 1kg, 30구, 1L)로. `unit`이 예상과 다르면 `null` + `unit_mismatch` | `goodPrice ÷ goodTotalCnt × base_unit_qty` (단위가 같을 때). 개수↔중량은 환산 기준이 있을 때만 |
| `variety_id` · `spec_id` | `source_code_map` (기간 조건) | `source_code_map`. `grdNm`은 축종으로 뜻을 정한다: 소 → 규격(등급), 수입 소고기 → 품종(원산지), `구분없음` → 기본 규격 | `product_source_key` → `product_variety_map` |
| `product_id` | `null` | `null` | `product_source_key`(조사일이 유효 기간 안) |
| 행사 3열 | `null` | `null` | `goodDcYn`·`plusoneYn`: `Y` → `true`, `N` → `false`, 태그 없음 → `null` |
| `promo_from` · `promo_to` | `null` | `null` | `goodDcStartDay` · `goodDcEndDay` (`goodDcYn = Y`일 때만) |
| `source_registered_at` | `orgnl_reg_dt` (UTC). 축산 행은 `null` | `null` | `inputDttm`을 `Asia/Seoul`로 |
| 성공 판정 | `resultCode "0"` (+ 요청 필수 조건 검증, 휴일 판정) | `resultCode 00` **그리고** 당일 행 1개 이상 | `resultCode 00` (빈 `<result/>`는 조사일 판별 규칙으로) |
| 행 단위 거부 | `exmn_ymd` 8자리·범위 안, `se_cd` = 요청, `exmn_dd_prc`·`unit_sz` 양의 정수, `null`은 부류 500만 | 가격 정수, `judgeKind` = 요청 | `goodPrice` 양의 정수, 날짜 형식 |

### 3-12. 변환 불가 케이스와 방침

원칙: 원본은 언제나 남긴다. ②로 넘길 수 있는 것은 넘기고 모르는 부분만 `null`로 둔다. 매핑이 없거나 해석이 안 되는 것은 `pending`으로 운영자에게 보낸다. 형식 자체가 깨진 행만 ②에서 뺀다.

| # | 케이스 | 출처 | 방침 |
|---|---|---|---|
| 1 | `grdNm`에 등급과 원산지가 섞임 (`1+등급` / `미국산` / `구분없음`) | 축평원 | 문자열 모양이 아니라 `judgeKind`로 뜻을 정한다 (소 → 규격, 수입 소고기 → 품종). 처음 보는 값은 `source_code_map` `pending` ([ekape.md 5장](sources/ekape.md)) |
| 2 | 평년 행에 날짜가 없음, 당일 행 없이 평년 행만 옴 | 축평원 | 요청 기준일을 붙여 `reference_observation`. 당일 행이 없으면 그날은 `pending`으로 다시 받기 |
| 3 | `grd_nm`이 등급이 아님 (돼지 부위명 `삼겹살`, 고등어 `-`, 코드표에 없는 `grd_cd 30`) | KAMIS | 이름은 쓰지 않고 코드로만 매핑. 코드표에 없는 코드는 `in_official_table = false`로 등록하고 `pending` |
| 4 | `exmn_dd_cnvs_prc`가 경우마다 다름 (축산은 `30320` 고정값) | KAMIS | 쓰지 않는다. `unit`·`unit_sz`로 직접 계산. `kg`·`g` 단위일 때만 교차 검증용 |
| 5 | 코드표에 없는 품목·시장 코드가 옴 (품목 4, 조합 39, 시장 6) | KAMIS | 응답으로 `source_code_table`·`obs_place`·`market`을 채운다. 막지 않는다 |
| 6 | 시장 유형을 이름 규칙으로 못 가름 (`가락소매` `1000006`, 도시 이름만인 코드) | KAMIS | `market_type = 'other'`, 운영자가 정한다. 전통시장 대 대형유통 집계에서 빠진다 |
| 7 | 익명 대형유통(`B-유통`)이 어느 판매처인지 모름 | KAMIS | 판매처로 매핑하지 않는다. 시장 유형까지만 쓴다 |
| 8 | 전일가 대체인지 실제로 같은 값인지 응답으로 모름 (같은 값 최대 66 조사일) | KAMIS, 축평원(표본 적은 품목) | 값은 그대로 넣고 `carried_over` 후보로만 표시한다. 기준 일수는 ② (`calc_param` placeholder) |
| 9 | 원천 품목 코드 개편 (참다래 `419` → 키위 `437`), 작형별 품종 코드 (배추 봄·고랭지·가을·월동) | KAMIS | `source_code_map`을 다대일 + 유효 기간으로. 개편 전후 코드를 같은 품종에 잇는다 |
| 10 | 개수 단위를 중량 기준 품종으로 (또는 반대) 바꿀 환산 기준이 없음 (참가격 `EA`·`MR`·`PK`·`DA`·`MA` 45개, KAMIS `손`·`마리`) | KAMIS, 참가격 | `price_per_base = null`, `unit_rule_id = null`. 관측값은 저장한다. 환산 기준이 정해지면 새 `unit_rule` 버전으로 다시 계산. 환산을 거친 판정은 신뢰도 한 단계 낮춤 ([domain-model.md 4장](../20-domain/domain-model.md)) |
| 11 | 도매 묶음 단위 (`kg(그물망 3포기)`·`10`) | KAMIS `02` | MVP는 받지 않는다. 받을 때 도매 기준 단위·환산 기준을 정한다 (3-1 도매 메모) |
| 12 | 축평원 단위가 예상과 다름 | 축평원 | `price_per_base = null`, `flags += 'unit_mismatch'`, 경보 |
| 13 | `plusoneYn = Y`일 때 `goodPrice`가 1개 값인지 묶음 값인지 모름 (아직 한 번도 안 옴) | 참가격 | 저장하되 `price_per_base = null`, `flags += 'one_plus_one_unverified'`. 처음 나온 날 운영자가 확인하고 환산 규칙을 정한다 |
| 14 | 행사 필드가 없음 | 참가격 | `null`(모름). `false`로 바꾸지 않는다. 평소가 계산에서 빼지 않고 이상치 규칙에 맡긴다 |
| 15 | 행사 기간이 조사일과 어긋남 (10-09분 135행 중 10행) | 참가격 | 행사 여부는 `goodDcYn`을 믿고 기간은 표시용 |
| 16 | 상품이 품종에 안 맞음 (가공식품 품종 단위 미정, 상품명이 품종·규격 둘 다인 일반 신선식품) | 참가격 | `product_variety_map` `pending`, 관측값 `variety_id = null`. `product_daily_summary`는 품종과 무관하게 만든다. 품종 단위는 `p3-variety-catalog/01` |
| 17 | `goodId` 재사용 의심 (소분류 변경, 이름+용량 동시 변경) | 참가격 | `product_source_key`를 끊고(`valid_to`) 운영자 확인. 상품 ID는 재사용하지 않는다 |
| 18 | 점포가 새 `entpId`로 재등록, 같은 점포 중복 등록 | 참가격 | 새 점포 행 + `store_link` + `lineage_id`. 집계는 lineage 기준 (3-2) |
| 19 | 편의점 본사 4곳 (서울 주소, 전국 공통 가격) | 참가격 | `region_scope = 'national_only'`. 지역 집계 제외 |
| 20 | AR 옛 광주·전남 코드와 새 통합 코드 혼재 | 참가격 | `region_code_map`으로 옛 코드 → 새 코드. 지역 집계는 새 코드 기준 |
| 21 | 제조사 이름이 API에 없음 | 참가격 | `maker_code`만 저장. 처리는 p2/06 |
| 22 | KAMIS 축산과 축평원이 같은 값 (출처 중복) | 둘 다 | 둘 다 저장하고 `role`로 대표를 정해 집계는 한 번만 센다. 대표 출처는 7장 |
| 23 | 같은 것이 출처마다 다른 이름 (특란30구 = `XL30구`, 목살 = `목심`) | 둘 다 | 출처 간 대조에 이름을 쓰지 않는다. 코드로만 |
| 24 | 등록 시각만 바뀌고 값은 같음 (KAMIS 재등록) | KAMIS | 정정이 아니다. `source_registered_at`만 갱신 (3-3) |
| 25 | 보존 기간이 지난 날짜의 재등록 | KAMIS | 관측값에 다시 넣고(`reloaded`) 그날 `daily_quote`를 다시 계산. 바뀌면 `corrected` (3-3) |
| 26 | 형식 위반 행 (필수 필드 없음, 타입 다름, 요청 범위 밖 날짜) | 모두 | ②로 넘기지 않고 원본에만. `raw_object.rejected_rows`에 세고 운영자 알림 (5-2 "응답 형식이 바뀜") |

---

## 4. 화면이 읽는 모양

세 출처를 엮어서 화면 하나에 필요한 것을 `judgment_snapshot.payload` 하나로 준다. 화면은 출처별 테이블을 따로 읽지 않는다. MVP에서는 공개 REST API를 두지 않고, `apps/web`의 서버 컴포넌트가 DB를 직접 읽는다 (읽는 방식은 `ingest-foundation/06`). 외부용 `/api/v1`은 확장 단계 E5다.

### 4-1. 품종 판정 payload (`/seasonal`과 같은 앱의 품종 가격 화면이 읽음)

예: 국산 삼겹살. 값은 10/6 실측에서 가져왔고, 평소가와 판정은 예시다.

```json
{
  "variety": { "slug": "pork-belly-kr", "name": "국산 삼겹살", "item": "돼지고기", "category": "정육·계란" },
  "spec": { "id": "default", "name": "구분없음", "options": [] },
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
      "by_channel": { "large_mart": 3280, "ssm": 3067, "department": 4941 }, "promo_excluded": 0 }
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
{ "variety": "pork-belly-kr", "spec": "default", "price": 15900, "qty": 500, "unit": "g", "promo": null }
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
| **DB에 연결 못 함** | Postgres 연결·쓰기 실패 | 원본은 먼저 Storage에 올리고, `raw_object.load_status = pending_load`를 남긴다. 다음 실행이 Storage 원본으로 다시 적재 | 영향 없음 (마지막 집계 유지) |
| **재계산 실패** | ②→③ 계산 중 오류 | 트랜잭션을 되돌려 직전 `judgment_snapshot`을 유지. 다음 실행에서 다시 계산 | 직전 판정 + "○일 기준" |
| **응답 형식이 바뀜** | 필수 필드가 없거나 타입이 다름, 처음 보는 코드 | 해당 행은 ②로 넘기지 않고 ① 원본에만 저장. 처음 보는 코드는 `source_code_table`·`source_item`에 넣고 매핑을 `pending`으로 등록 (3-1) | 영향 없음. 운영자 알림 |
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

## 6-1. 정한 것 (2026-10-20)

`p4/01`의 추천 중 사용자가 정한 것 (2026-10-20). 7장 표에서 옮겼다.

| 결정 | 내용 |
|---|---|
| 축산 대표 출처 | 조합(원천 키) 단위. 두 출처에 다 있는 조합은 축평원이 대표, KAMIS에만 있는 조합(한우 1++, 계란 규격, 닭 호수)은 KAMIS가 대표. 둘 다 관측값에 넣고 집계는 대표만 센다 |
| KAMIS 시장별 관측값 | 최근 **90일**만 관측값으로 둔다. 시장 유형별·품종별 집계(`daily_quote`)는 영구. 그래서 시장 하나(예: 경동시장)의 추이는 최근 90일까지, 전통시장 대 대형유통 추이는 전 기간 볼 수 있다. 5년 백필은 넣고 집계를 만든 뒤 90일 밖 행을 지운다. 평년은 집계의 5년 값으로 계산한다 |
| 참가격 점포별 관측값 | 최근 **8 조사일**(약 16주). 상품별 집계(`product_daily_summary`)는 영구 |
| 원본 파일(Storage) 보존 | KAMIS·축평원은 1년 지난 원본을 지운다(다시 받을 수 있음). 참가격은 지우지 않는다 |
| 지역 코드 | 법정동 코드 앞자리(시도 2자리, 시군구 5자리), 전국 `00`. 표준 코드를 아직 확인하지 못한 지역(전남광주통합특별시)은 확인 전까지 임시 코드 |
| 시도별 집계 | MVP에서는 만들지 않는다. 원본에서 나중에 만든다 |
| 원본 파일 단위 | 실행 × 기능 × 대상 날짜마다 파일 하나. 직전과 해시가 같은 다시 받기는 올리지 않고 `duplicate`로 기록 (3-7) |
| 파티셔닝 | 처음에는 하지 않는다. PK에 `obs_date`가 있어 나중에 월 단위로 바꿀 수 있다 |
| ID | 우리가 발급하는 ID(품종·상품·점포 등)는 `integer` identity, 계속 쌓이는 기록 표만 `bigint`. **출처는 ID에 넣지 않고** `source` 열과 읽을 수 있는 출처 키(`kamis:01-200-224-01-04`, `chamga:1000`)로 표시한다. 품종 하나에 여러 출처가 붙기 때문이다 |
| 기간 겹침 방지 | 기간이 있는 연결표(`source_code_map`, `product_source_key`, `product_variety_map`, `store_seller`)는 같은 키의 기간이 겹치면 DB가 거부한다 (`btree_gist` exclusion). 예: 참가격 1000번이 왕뚜껑 110g(~2026-12)과 120g(2027-01~)을 시기별로 가리키면, 두 상품은 서로 다른 상품 ID이고 기간이 겹치는 입력은 저장되지 않는다 |
| 새 상품 판별 | DB에 없는 출처 번호는 새 상품. 용량·원산지가 다르면 다른 상품(원산지는 품종에서 갈림), 등급은 같은 품종의 다른 규격. 브랜드 상품("○○사 삼겹살")은 일반 상품과 합치지 않고 같은 품종에 연결해 함께 검색된다. 같은 물건인데 출처 번호·이름이 바뀐 경우 운영자가 두 상품을 하나로 합칠 수 있고 과거 가격이 이어진다 (3-6) |
| 점포 → 판매처 매핑 | **유효 기간을 둔다.** 점포의 판매처가 바뀌면(예: 홈플러스 → 롯데슈퍼) 이전 기간을 닫고 새 기간을 연다. 과거 평균은 당시 판매처로, 이후는 새 판매처로 계산된다. 참가격이 새 `entpId`로 재등록하면 `store_link`로 잇는다 |
| 행사 구분 | 참가격 플래그로 가른다. `goodDcYn`(할인, 기간 포함)·`plusoneYn`(1+1)이 Y면 행사, N이면 일반, 값이 없으면 모름(null). 판매가는 할인 반영가라 평소가 계산에서 행사·모름은 뺀다. `plusoneYn=Y`는 아직 나온 적이 없어, 처음 나온 날 판매가가 1개 값인지 묶음 값인지 확인하고 그 전에는 기준 단위 가격을 비운다 (3-12 #13) |

## 7. 열린 질문

"추천"은 `p4/01`(2026-10-19)이 스키마를 짜며 낸 의견이다. 결정이 아니다. 정해지면 이 표에서 지우고 해당 문서에 결정으로 옮긴다.

| 질문 | 추천 | 다룰 곳 |
|---|---|---|
| 상품 화면의 점포별 가격을 익명 키로 읽게 할지 (관측값은 비공개) | 웹앱이 서버 전용 읽기 롤로 읽으면 관측값을 열지 않아도 된다. supabase-js + anon이면 최근 조사일 점포별 가격을 담는 공개 요약 표를 따로 둔다 | ① `ingest-foundation/06` |
| KAMIS 친환경·중도매를 저장할지 (도매는 MVP 이후, E3) | | 확장 E3 |
| 평소가 계산식 (KAMIS 5년 평년, 축평원 평년, 최근 N주 중앙값을 섞는 방식) | | ② |
| 최소 표본 수, 갱신 지연(이월) 기준 일수, 이상치 기준 | `calc_param`에 자리만 두었다 (3-4) | ② |
| 판정 스냅샷 재계산 주기 (하루 1번 vs 수집 직후마다) | | ① `ingest-foundation/05` |
| Vercel Hobby 상업 이용 제한 여부 | | ④ (사용자 확인) |
| Supabase Free 일시정지 기준과 수집으로 막을 수 있는지 | | ① `ingest-foundation/05` |
| 축평원 D일분 등록 시각 (D일 16:30 이후 ~ D+1 10:10 이전까지만 앎) | | ① `p2/03` (실측) |
