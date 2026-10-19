# 02. 스키마·마이그레이션·RLS

Status: ready-for-agent
Type: task
Blocked by: p4-canonical-model/01

## 목적

pipeline.md 3장의 테이블을 Postgres DDL로 만들고 마이그레이션으로 관리한다. 시작 전에 `supabase-postgres-best-practices` 스킬을 읽는다.

## 할 일

- [ ] 위치: 저장소 루트 `supabase/migrations/` (Supabase CLI). `docs/project-structure.md`에 추가
- [ ] 테이블 (pipeline.md 3-0의 목록, `p4/01` 2026-10-19):
  - 분류·매핑(3-1): `category`, `item`, `variety`, `spec`(초안의 `grade`), `alias`, `variety_seasonal_map`, `source_code_table`, `source_item`, `source_code_map`, `unit_rule`
  - 판매처·점포·시장·지역(3-2): `region`, `region_code_map`, `seller`, `obs_place`, `store`, `store_link`, `market`, `source_master_change`
  - 관측값(3-3): `observation`, `observation_revision`, `reference_observation`
  - 집계·판정(3-4): `daily_quote`, `product_daily_summary`, `reference_price`, `usual_price`, `judgment_batch`, `judgment_current`, `judgment_snapshot`, `calc_param`
  - 수집 상태(3-5): `ingest_run`, `source_day`, `source_day_part`, `backfill_task`
  - 상품(3-6): `product`, `product_source_key`, `product_attr_history`, `product_variety_map`, `al_variety_rule`
  - 원본 보관(3-7): `raw_object`
- [ ] 자연키 PK·unique, upsert용 인덱스, 기간 질의 인덱스 (품종 × 날짜), 3-3의 BRIN, 기간 겹침 exclusion 제약(`btree_gist`), 3-0의 FK 인덱스 규칙과 예외
- [ ] `calc_param` 초기값 (3-4 표)
- [ ] 보존 기간 정리 작업 (KAMIS 관측값 90일, 참가격 8 조사일, 권장값. 3-9)
- [ ] RLS
  - 모든 테이블 RLS 켬
  - 익명 읽기는 3-0 목록의 "공개" 표만, 읽기만 허용 (`judgment_snapshot`은 현재 묶음만). 관측값·수집 상태·원본·원천 키 등록부는 막음
  - 쓰기는 서비스 롤(Actions)만
- [ ] Storage 버킷 `raw` 정책: 비공개, 서비스 롤만
- [ ] 정할 것 (pipeline.md 7장, 추천 있음): 축산 대표 출처(축평원 vs KAMIS), 참가격 점포별 관측값 보관 회차, KAMIS 백필 보관 방식, 지역 코드 체계, 시도 범위 집계, 파티셔닝, 마스터 ID 타입, 기간 겹침 제약
- [ ] 용량 실측 방법(`pg_total_relation_size`)을 05의 수집 상태에 연결

## 완료 기준

- 빈 DB에 마이그레이션을 적용하면 모든 테이블·정책이 생긴다.
- 익명 키로 관측값을 읽으려 하면 거부되는 것을 확인했다.
