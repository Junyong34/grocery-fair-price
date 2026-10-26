# 08. 품종 카탈로그를 운영 DB에 넣기

Status: claimed
Type: task
Blocked by: p3-variety-catalog/01 (resolved)

## 목적

확정한 품종 목록([variety-list.md](../../../grocery-price/docs/30-data/variety-list.md))을 운영 DB의 분류 표(`category`·`item`·`variety`·`spec`·`variety_seasonal_map`·`unit_rule`)와 매핑(`source_code_map`·`product_variety_map`)으로 넣는다. 지금 운영 DB에는 분류 표가 비어 있어 모든 관측값이 `variety_id = null`이다.

## 사실 (2026-10-26 운영 DB 조회)

- 운영 DB에는 참가격 관측값만 있다 (298,878행, 조사일 2026-06-12~07-10). KAMIS·축평원은 정기 수집 워크플로(`ingest-schedule/11`)가 아직 없어 원천 키가 0개다.
- 분류 표는 운영자 표라 `ingest_writer`가 쓰지 못한다 (grants 마이그레이션). 소유자(`postgres`) 접속이 필요하고, 그 비밀번호는 로컬 `.env`에 없다 (`ingest-foundation/01` 사람 확인 항목).

## 할 일

- [x] **카탈로그 데이터** `packages/price-ingest/src/catalog/varieties.ts`: 카테고리·품목·품종·규격(첫째가 기본)·기준 단위·제철 id, 규격마다 원천 키(KAMIS `품목-품종-등급`, 품종 `*`는 철마다 바뀌는 코드; 축평원 `축종-품목코드-구분명`; 참가격 `goodId`). DB에 넣는 진실은 이 파일이고, `variety-list.md`는 사람이 읽는 표다
- [x] 테스트: slug 중복 없음, 품종마다 규격 하나 이상, KAMIS·축평원 키가 실측 코드표(`samples/inventory/*.csv`)에 있음, 참가격 goodId가 신선식품, 제철 id가 `packages/seasonal`에 있음, `variety-list.md`의 품종 이름·기준 단위·제철 id·커버 상태와 같음
- [x] **분류 표 적용 명령** (소유자 접속): slug로 upsert, 카탈로그에서 빠진 품종은 지우지 않고 `hidden`. 끝에 "기본 규격이 없는 활성 품종" 검사(pipeline 3-1). 단위 규칙 `retail-g`·`retail-ea`·`retail-ml` (`same_unit`)
- [x] **매핑 적용 명령** (`ingest_writer`): 카탈로그 키와 맞는 원천 키의 `pending` 매핑을 `mapped`로, 참가격 신선 상품은 `product_variety_map`에 `operator`로, 가공식품은 `ignored`로. 축산은 두 출처에 다 있으면 축평원이 `primary`, KAMIS가 `secondary` (pipeline 6-1)
- [x] 로컬에서 두 명령을 빈 DB와 샘플 DB에 돌려 검증 (`test:db`)
- [ ] 운영 적용: 사람이 소유자 비밀번호로 분류 표 명령을 돌리고, 매핑 명령을 돌린다

## 정한 것

- 품종 slug는 영어 kebab (`napa-cabbage`, `hanwoo-sirloin`). 제철 id와 같은 방식이지만 별도 체계라 다를 수 있다 (pipeline 3-1).
- 규격 slug: 상품 `top`, 중품 `mid`, 규격을 가르지 않으면 `default`(기본).
- 참가격: 카탈로그의 신선 상품(66개)은 `mapped`, 원산지가 없는 볶음참깨 5개는 `pending`(`CHAMGA_UNDECIDED`), 나머지 식품 상품은 `ignored`. AL 소분류 코드 앞자리는 대분류와 맞지 않아(신선식품 중 15개가 `0302`) 가르는 데 쓰지 않는다.
- 매핑 적용은 `pending`만 바꾼다. 이미 `mapped`·`ignored`인데 카탈로그와 품종·규격·대표 여부가 다르면 고치지 않고 `conflicts`로 알린다 (운영자가 정한 것을 덮지 않는다).
- 기준 단위로 바꿀 수 없는 단위(고등어 1손, 참가격 양파 1망·시금치 1단·갈치 100g 대 1마리)도 품종에는 잇는다(`mapped`). 기준 단위 가격만 `null`이 된다 (pipeline 3-1 "단위가 맞지 않고 환산 기준도 없으면 null").

## 연결

- 적재 때 매핑을 쓰고 기존 관측값을 다시 매핑하는 일은 [09](09-apply-mapping-on-load.md).
- 판매처(`seller`)도 운영자 표라 [07](07-chamga-seller-summary-retention.md)이 같은 소유자 적용 명령을 쓴다.

## 진행 기록

- 2026-10-26: 카탈로그 `packages/price-ingest/src/catalog/`(품종 133, 규격 193, KAMIS 키 187개로 소매 코드 186개 전부·축평원 27개 전부, 참가격 신선 상품 66개)와 명령 `catalog --classes|--mappings [--dry-run]`을 만들었다. `test/catalog.test.ts`(실측 코드표·제철 id·variety-list.md 대조)와 `test/db/catalog.db.test.ts`(되돌리는 트랜잭션에서 분류 표·매핑, `ingest_writer`가 분류 표를 못 씀, 같은 트랜잭션에서 `ingest_writer`로 매핑)가 통과한다.
- 남은 것: 운영 적용. 사람이 Supabase 대시보드(Connect → Session pooler)의 `postgres` 접속 주소와 DB 비밀번호로 `.env`에 `OWNER_DATABASE_URL`을 넣는다 (Actions에는 넣지 않는다). 그 뒤 `--classes --dry-run` → `--classes` → `--mappings`.
