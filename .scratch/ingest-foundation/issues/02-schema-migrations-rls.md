# 02. 스키마·마이그레이션·RLS

Status: ready-for-agent
Type: task
Blocked by: p4-canonical-model/01

## 목적

pipeline.md 3장의 테이블을 Postgres DDL로 만들고 마이그레이션으로 관리한다. 시작 전에 `supabase-postgres-best-practices` 스킬을 읽는다.

## 할 일

- [ ] 위치: 저장소 루트 `supabase/migrations/` (Supabase CLI). `docs/project-structure.md`에 추가
- [ ] 테이블: 분류·매핑(3-1, 가격 품종 ↔ 제철 품종 매핑표 포함), 점포·시장·지역(3-2, KAMIS `market_type`), 관측값(3-3), 집계·판정(3-4), 수집 상태(3-5)
- [ ] 자연키 unique, upsert용 인덱스, 기간 질의 인덱스 (품종 × 날짜)
- [ ] RLS
  - 모든 테이블 RLS 켬
  - 익명 읽기는 화면이 읽는 테이블(`daily_quote`, `judgment_snapshot`, 분류)만, 읽기만 허용. 관측값·수집 상태·원본은 막음
  - 쓰기는 서비스 롤(Actions)만
- [ ] Storage 버킷 `raw` 정책: 비공개, 서비스 롤만
- [ ] 정할 것: 축산 대표 출처(축평원 vs KAMIS), 참가격 점포별 관측값 보관 회차 (pipeline.md 7장)
- [ ] 용량 실측 방법(`pg_total_relation_size`)을 05의 수집 상태에 연결

## 완료 기준

- 빈 DB에 마이그레이션을 적용하면 모든 테이블·정책이 생긴다.
- 익명 키로 관측값을 읽으려 하면 거부되는 것을 확인했다.
