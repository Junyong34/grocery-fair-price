# 02. 스키마·마이그레이션·권한·RLS

Status: ready-for-agent
Type: task
Blocked by: p4-canonical-model/01

## 목적

pipeline.md 3장의 테이블을 Postgres DDL로 만들고 마이그레이션으로 관리한다. 시작 전에 `supabase-postgres-best-practices` 스킬을 읽는다. 2026-10-20 스키마 검토로 바뀐 것(스키마 `price`, 롤 두 개, 서버 전용 읽기, 복합 FK, 바뀐 행만 고쳐 쓰는 upsert)은 pipeline.md 3-0·6-1에 있다.

## 할 일

- [ ] 위치: 저장소 루트 `supabase/migrations/` (Supabase CLI). `docs/project-structure.md`에 추가. 적용은 로컬에서 `supabase db push` (`SUPABASE_DB_PASSWORD`, 01)
- [ ] 첫 마이그레이션: `create extension if not exists btree_gist with schema extensions;` (버전 적지 않음), `create schema price`, `public`·`anon`·`authenticated`의 스키마 권한과 기본 권한(표·시퀀스·함수) 걷기 (pipeline.md 3-0 "스키마와 노출")
- [ ] 롤: `ingest_writer`, `web_reader`를 `login nosuperuser nocreatedb nocreaterole noinherit`로 만들고 비밀번호는 넣지 않는다 (사람이 01에서 정함). 표 소유자는 `postgres`. 권한은 3-0 "역할" 표대로, `web_reader`는 `default_transaction_read_only = on`·`statement_timeout`
- [ ] 표 만드는 순서는 3-0 "만드는 순서" (`ingest_run` → `raw_object` → 이를 가리키는 표)
- [ ] 테이블 (pipeline.md 3-0의 목록, `p4/01` 2026-10-19):
  - 분류·매핑(3-1): `category`, `item`, `variety`, `spec`(초안의 `grade`), `alias`, `variety_seasonal_map`, `source_code_table`, `source_item`, `source_code_map`, `unit_rule`
  - 판매처·점포·시장·지역(3-2): `region`, `region_code_map`, `seller`, `obs_place`, `store`, `store_link`, `store_seller`, `market`, `source_master_change`
  - 관측값(3-3): `observation`, `observation_revision`, `reference_observation`
  - 집계·판정(3-4): `daily_quote`, `product_daily_summary`, `reference_price`, `usual_price`, `judgment_batch`, `judgment_current`, `judgment_snapshot`, `calc_param`
  - 수집 상태(3-5): `ingest_run`, `source_day`, `source_day_part`, `backfill_task`, 백필 임시 적재 `kamis_backfill_stage` (UNLOGGED, 3-9)
  - 상품(3-6): `product`, `product_source_key`, `product_attr_history`, `product_variety_map`, `al_variety_rule`
  - 원본 보관(3-7): `raw_object` (`purged_at` 포함)
  - 뷰: `current_judgment` (`security_invoker = true`, 3-4)
- [ ] 자연키 PK·unique (같음 조건 열 먼저, 날짜 끝), 기간 질의 인덱스, 3-3의 BRIN, 기간 겹침 exclusion 제약(`btree_gist`, `region_code_map`·`product_attr_history` 포함), 기간 check (`valid_to > valid_from`), 3-0의 FK 인덱스 규칙과 생략 목록
- [ ] 규격 일관성: `spec unique (variety_id, id)`와 `(variety_id, spec_id)` 복합 FK, 매핑 표의 `mapped → variety_id·spec_id·unit_rule_id not null` check, `spec`의 기본 규격은 `create unique index … where is_default`
- [ ] 하위 표 종류 보장: `obs_place unique (id, kind)`, `store`·`market`의 상수 `kind` 열과 복합 FK
- [ ] `observation` 저장 설정 `fillfactor = 90`, `autovacuum_vacuum_scale_factor = 0.05`
- [ ] **용량 먼저 재기**: 다른 작업 전에 샘플로 관측값 1만 행을 넣고 `pg_total_relation_size('price.observation')`로 행당 크기를 잰다. pipeline.md 2장·3-9의 추정(200~250B)을 고친다. 1년차 추정이 500MB에 닿으면 7장 "DB 용량"의 순서로 줄인다
- [ ] `calc_param` 초기값 (3-4 표)
- [ ] 보존 기간 정리 작업 (KAMIS 관측값 90일, 참가격 8 조사일, 6-1. 출처 조건은 `source_item` 조인으로, 3-3)
- [ ] RLS (이중 장치. 접근은 GRANT가 정한다)
  - 모든 표 RLS 켬
  - 정책은 롤마다 명시: `ingest_writer`는 `for all using (true) with check (true)`, `web_reader`는 읽기 표에만 `for select using (true)`. `anon`·`authenticated` 정책은 만들지 않는다
  - `judgment_snapshot`의 "현재 묶음만" 정책은 두지 않는다 (뷰 `current_judgment`로 읽음)
- [ ] Storage 버킷 `raw`: 비공개, 정책 없음. 비밀 키(`sb_secret_…`)로만 쓴다
- [x] 정할 것 (pipeline.md 7장): 축산 대표 출처, 참가격 점포별 관측값 보관 회차, KAMIS 백필 보관 방식, 지역 코드 체계, 시도 범위 집계, 파티셔닝, 마스터 ID 타입, 기간 겹침 제약, 스키마·롤·키·웹 읽기 → 모두 6-1에서 정함 (2026-10-20)
- [ ] 용량 실측 방법(`pg_total_relation_size`)을 05의 수집 상태에 연결

## 완료 기준

- 빈 DB에 마이그레이션을 적용하면 확장·스키마·롤·모든 테이블·뷰·권한·정책이 생긴다.
- 테스트로 확인했다: (1) `web_reader`로 읽기 표마다 넣어 둔 행이 보인다 (정책 누락은 빈 결과로만 드러난다), (2) `web_reader`로 `observation`·`source_day`·`raw_object`를 읽거나 아무 표에 쓰면 `42501`, (3) `anon`·`authenticated`로 `price`의 어느 표도 못 읽는다, (4) `ingest_writer`로 분류 표에 쓰면 거부된다.
- 관측값 1만 행 실측값이 pipeline.md 3-9에 들어가 있다.
