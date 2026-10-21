# 02. 스키마·마이그레이션·권한·RLS

Status: resolved
Type: task
Blocked by: p4-canonical-model/01

## 목적

pipeline.md 3장의 테이블을 Postgres DDL로 만들고 마이그레이션으로 관리한다. 시작 전에 `supabase-postgres-best-practices` 스킬을 읽는다. 2026-10-20 스키마 검토로 바뀐 것(스키마 `price`, 롤 두 개, 서버 전용 읽기, 복합 FK, 바뀐 행만 고쳐 쓰는 upsert)은 pipeline.md 3-0·6-1에 있다.

## 할 일

- [x] 위치: 저장소 루트 `supabase/migrations/` (Supabase CLI). `docs/project-structure.md`에 추가. 적용은 로컬에서 `supabase db push` (`SUPABASE_DB_PASSWORD`, 01)
- [x] 첫 마이그레이션: `create extension if not exists btree_gist with schema extensions;` (버전 적지 않음), `create schema price`, `public`·`anon`·`authenticated`의 스키마 권한과 기본 권한(표·시퀀스) 걷기 (pipeline.md 3-0 "스키마와 노출"). 함수는 스키마별 기본 권한으로 못 막으므로(전역 `PUBLIC` `EXECUTE`), `price`에 함수를 만드는 마이그레이션은 같은 파일에서 `revoke execute … from public, anon, authenticated` 후 필요한 롤에만 `grant` (3-0 "기본 권한의 한계", 2026-10-21)
- [x] 롤: `ingest_writer`, `web_reader`를 `login nosuperuser nocreatedb nocreaterole noinherit`로 만들고 비밀번호는 넣지 않는다 (사람이 01에서 정함). 표 소유자는 `postgres`. 권한은 3-0 "역할" 표대로, `web_reader`는 `default_transaction_read_only = on`·`statement_timeout`
- [x] 표 만드는 순서는 3-0 "만드는 순서" (`ingest_run` → `raw_object` → 이를 가리키는 표)
- [x] 테이블 (pipeline.md 3-0의 목록, `p4/01` 2026-10-19):
  - 분류·매핑(3-1): `category`, `item`, `variety`, `spec`(초안의 `grade`), `alias`, `variety_seasonal_map`, `source_code_table`, `source_item`, `source_code_map`, `unit_rule`
  - 판매처·점포·시장·지역(3-2): `region`, `region_code_map`, `seller`, `obs_place`, `store`, `store_link`, `store_seller`, `market`, `source_master_change`
  - 관측값(3-3): `observation`, `observation_revision`, `reference_observation`
  - 집계·판정(3-4): `daily_quote`, `product_daily_summary`, `reference_price`, `usual_price`, `judgment_batch`, `judgment_current`, `judgment_snapshot`, `calc_param`
  - 수집 상태(3-5): `ingest_run`, `source_day`(`corrected_at`·`correction_count`, `corrected` 상태 없음), `source_day_part`(`source_day`로 복합 FK), `backfill_task`. 백필용 고정 표는 두지 않는다 (RLS 표에 `COPY` 불가, 세션 임시 표를 쓴다, 3-0·3-9 2026-10-21)
  - 상품(3-6): `product`(`registered_on`·`first_price_on`·`last_price_on`, `merged_into`, 상태 `merged`), `product_source_key`, `product_attr_history`, `product_variety_map`, `al_variety_rule`
  - 원본 보관(3-7): `raw_object` (`purged_at` 포함)
  - 뷰: `current_judgment` (`security_invoker = true`, 3-4)
- [x] 자연키 PK·unique (같음 조건 열 먼저, 날짜 끝), 기간 질의 인덱스, 3-3의 BRIN, 기간 겹침 exclusion 제약(`btree_gist`, `region_code_map`·`product_attr_history` 포함), 기간 check (`valid_to > valid_from`), 3-0의 FK 인덱스 규칙과 생략 목록
- [x] 규격 일관성: `spec unique (variety_id, id)`와 `(variety_id, spec_id)` 복합 FK, 매핑 표의 `mapped → variety_id·spec_id·unit_rule_id not null` check, `spec`의 기본 규격은 `create unique index … where is_default`. "하나는 있다"는 트리거 없이 검사 질의로 (pipeline.md 3-1 "기본 규격이 꼭 하나 있게 한다"): 시드 스크립트 끝과 테스트에서 돌린다
- [x] 하위 표 종류 보장: `obs_place unique (id, kind)`, `store`·`market`의 상수 `kind` 열과 복합 FK
- [x] `observation` 저장 설정 `fillfactor = 90`, `autovacuum_vacuum_scale_factor = 0.05`
- [x] **용량 먼저 재기**: 다른 작업 전에 샘플로 관측값 1만 행을 넣고 `pg_total_relation_size('price.observation')`로 행당 크기를 잰다. 집계 표(`daily_quote`, `product_daily_summary`, `reference_price`, `usual_price`)도 샘플 행으로 같이 잰다. pipeline.md 2장·3-9의 추정(관측값 200~250B, 집계 120~150B, `usual_price` 200~300B)을 고친다. 1년차 추정이 500MB에 닿으면 7장 "DB 용량"의 순서로 줄인다
- [x] `calc_param` 초기값 (3-4 표)
- [x] 보존 기간 정리 작업 (KAMIS 관측값 90일, 참가격 8 조사일, 6-1. 출처 조건은 `source_item` 조인으로, 3-3)
- [x] RLS (이중 장치. 접근은 GRANT가 정한다)
  - 모든 표 RLS 켬
  - 정책은 롤마다 명시: `ingest_writer`는 `for all using (true) with check (true)`, `web_reader`는 읽기 표에만 `for select using (true)`. `anon`·`authenticated` 정책은 만들지 않는다
  - `judgment_snapshot`의 "현재 묶음만" 정책은 두지 않는다 (뷰 `current_judgment`로 읽음)
- [x] Storage 버킷 `raw`: 비공개, 정책 없음. 비밀 키(`sb_secret_…`)로만 쓴다
- [x] 정할 것 (pipeline.md 7장): 축산 대표 출처, 참가격 점포별 관측값 보관 회차, KAMIS 백필 보관 방식, 지역 코드 체계, 시도 범위 집계, 파티셔닝, 마스터 ID 타입, 기간 겹침 제약, 스키마·롤·키·웹 읽기 → 모두 6-1에서 정함 (2026-10-20)
- [x] 용량 실측 방법(`pg_total_relation_size`)을 05의 수집 상태에 연결

## 완료 기준

- 빈 DB에 마이그레이션을 적용하면 확장·스키마·롤·모든 테이블·뷰·권한·정책이 생긴다.
- 테스트로 확인했다: (1) `web_reader`로 읽기 표마다 넣어 둔 행이 보인다 (정책 누락은 빈 결과로만 드러난다), (2) `web_reader`로 `observation`·`source_day`·`raw_object`를 읽거나 아무 표에 쓰면 `42501`, (3) `anon`·`authenticated`로 `price`의 어느 표도 못 읽는다, (4) `ingest_writer`로 분류 표에 쓰면 거부된다.
- 테스트로 확인했다 (2026-10-21 코드 리뷰):
  - (5) 권한 질의 두 개(pipeline.md 3-0 "기본 권한의 한계")가 0행: `PUBLIC`·`anon`·`authenticated`가 실행할 수 있는 `price` 함수, 권한을 가진 `price` 표·뷰가 없다 (`has_function_privilege`, `has_table_privilege`).
  - (6) 기본 규격 검사 질의(3-1)가 시드 뒤 0행이고, 기본 규격을 지운 품종을 넣으면 1행을 낸다.
  - (7) 실제 `ingest_writer` 롤로 백필 묶음 하나를 적재하면 성공한다 (세션 임시 표 `COPY` → `daily_quote` → 최근 90일만 `observation`에 `insert … select`). 같은 롤로 RLS 표 `observation`에 바로 `COPY`하면 실패하는 것도 고정한다.
  - (8) 상품 연결만 바뀐 파일을 다시 적재하면 `observation.product_id`가 바뀌고 `revision`은 그대로다.
  - (9) `partial`인 날에 가격 정정이 오면 상태는 `partial`로 남고 `corrected_at`이 채워지며 `correction_count`가 1 오른다.
- 관측값 1만 행 실측값이 pipeline.md 3-9에 들어가 있다.

## Answer

2026-10-21. Supabase 계정이 아직 없어(01) 로컬 `supabase start`(Docker, Postgres 17)로 검증했다. 운영 DB 적용(`pnpm exec supabase db push`)은 01 뒤에 사람이 한다. 그 뒤 01의 롤 비밀번호 단계를 한다.

- 마이그레이션 4개 (`supabase/migrations/`): `price_foundation`(btree_gist, 스키마 `price`, 기본 권한 걷기, 롤 두 개), `price_tables`(표 40개, 인덱스, 뷰 `current_judgment`), `price_grants_rls`(롤별 GRANT, 모든 표 RLS와 롤별 정책), `price_calc_param_retention`(`calc_param` 초기값 10개, 보존 정리 함수 `price.purge_expired_observations(date)`, `ingest_writer`만 실행).
- 시드 `supabase/seed.sql`: 지역(전국·시도 17·통합 임시 코드 `T1`), 샘플에 나오는 품종 8개의 임시 분류, `same_unit v1`, 판매처 14곳. 끝에서 기본 규격 검사 질의를 돌려 실패하면 멈춘다. 운영 품종 목록은 p3/01.
- 테스트 데이터: `packages/price-db`의 `load-samples`가 저장 샘플(KAMIS 5파일, 축평원 8파일, 참가격 가격 2파일·상품·점포 마스터)을 `ingest_writer`로 넣는다. 관측값 1,208행, `daily_quote` 35행, 상품 요약 1,118행, 판정 묶음 하나. KAMIS 배추 14일은 백필 길(임시 표 → `daily_quote` → 최근 90일만 관측값), 나머지는 정기 적재 길(임시 표 → 정정 이력 → 바뀐 행만 병합).
- 테스트: `pnpm db:test` (201개). 완료 기준 (1)~(9) 모두, 그 밖에 복합 FK·mapped check·하위 표 종류·기간 겹침·기간 check·저장 설정·값이 같은 다시 받기의 갱신 0행·보존 정리·ERD 최신 여부.
- 용량 실측 (pipeline.md 3-9에 표): 관측값 KAMIS 216B, 참가격 185B(매핑 뒤 220B), `daily_quote` 266B, `product_daily_summary` 175B, `reference_price` 208B, `usual_price` 291B (10만 행, 인덱스 포함). 집계가 어림의 두 배라 1년차가 참가격 8 조사일 기준 495~575MB로 나왔다. 7장 순서의 첫 단계대로 참가격 보관을 **6 조사일**로 줄였다 (1년차 465~525MB). 남은 단계는 7장.
- ERD: `schema-map.html`의 관계도 6개와 표 수를 `pnpm db:erd`(`packages/price-db/scripts/build-erd.ts`)가 DB 카탈로그에서 만든다. `pnpm db:test`가 HTML이 DB와 다르면 실패한다.

설계 문서에 없던 것 (작은 보강):
- `raw_object`: `check ((load_status = 'duplicate') = (duplicate_of is not null))`. `obs_place`: 처음·마지막 본 날은 함께 비거나 함께 차고 순서가 맞다. `store`: 위도·경도는 함께. `source_item`·`source_code_table`: `last_seen_on >= first_seen_on`. `store_link`: 옛 점포 ≠ 새 점포. `variety.base_unit_qty > 0`.
- `ingest_run.source`에 `'all'`(출처를 가리지 않는 `recompute`). 롤 설정에 `idle_in_transaction_session_timeout` (`ingest_writer` 2분, `web_reader` 30초), `ingest_writer.statement_timeout = 10min`.
- 로컬 Supabase 포트는 5532x대 (54322가 이 기계에서 이미 쓰이고 있었다).
- Supabase에서 `postgres`는 superuser가 아니라 `alter role … nosuperuser`를 못 한다. 롤 속성은 `create role`에서만 정한다.
- `web_reader`의 쓰기는 세션 기본값 때문에 먼저 `25006`(읽기 전용 트랜잭션)으로 막힌다. 테스트는 `set transaction read write`로 풀어도 `42501`인지 따로 본다.
