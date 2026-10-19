# Supabase용 에이전트 스킬 조사

DB를 Supabase로 정하면 쓸 에이전트 스킬을 조사했다. 조사일은 2026-10-19. 설치 수는 조사 시점의 skills 레지스트리 값이다. DB 선택 자체는 로드맵 P6에서 ADR로 정한다([roadmap.md](../00-overview/roadmap.md)).

---

## 1. 핵심 스킬 두 개

| 스킬 | 설치 수 | 역할 |
|---|---|---|
| `supabase/agent-skills/supabase-postgres-best-practices` | 45.0만 | 설계와 최적화를 함께 다룸 (핵심) |
| `supabase/agent-skills/supabase` | 33.2만 | Supabase 플랫폼 운영·관리 |

### supabase-postgres-best-practices

이 환경에 이미 설치돼 있다 (사용 가능한 스킬 목록에 있음).

- 규칙이 8개 카테고리로 나뉘고, 영향도 순으로 정렬돼 있다: 쿼리 성능·커넥션 관리(최우선), 보안·RLS, 스키마 설계, 동시성(locking), 데이터 접근 패턴, 모니터링, 고급 기능.
- 규칙마다 잘못된 SQL과 올바른 SQL을 비교하는 예시와 EXPLAIN 분석이 붙어 있다.
- 테이블·컬럼 생성, 마이그레이션, 인덱스, RLS, 느린 쿼리 진단 상황에서 자동으로 로드된다.

### supabase (공식)

- Database(RLS, 마이그레이션), Auth, Edge Functions, Realtime, Storage, Vector, Cron, Queue까지 Supabase 제품 전체를 다룬다.
- CLI로 스키마 관리, 마이그레이션, 보안 감사를 할 수 있고, MCP 서버로 DB를 직접 조회하거나 advisor 점검을 돌릴 수 있다.
- "변경이 잦으니 학습 데이터 대신 changelog와 최신 문서를 먼저 확인하라"는 원칙이 들어 있다.

---

## 2. 테이블·스키마 설계를 더 깊게 할 때

| 스킬 | 설치 수 | 특징 |
|---|---|---|
| `wshobson/agents/postgresql-table-design` | 2.7만 | 가장 구체적인 설계 가이드. 3NF 우선, PK는 `BIGINT GENERATED ALWAYS AS IDENTITY`, FK 컬럼에 인덱스, 금전은 `NUMERIC`, 이벤트 시각은 `TIMESTAMPTZ`를 권장한다. 1억 행 이상 테이블의 파티셔닝과 무중단 스키마 변경도 다룬다. |
| `softaworks/agent-toolkit/database-schema-designer` | 4.3K | 데이터 모델을 말로 설명하면 완성된 SQL 스키마를 만들어 준다. 범용이라 Postgres 전용은 아니다. |
| `github/awesome-copilot/postgresql-code-review` | 1.3만 | 이미 만든 스키마를 리뷰한다. 제약, RLS, 권한, 트리거를 점검한다. |

---

## 3. 최적화·관리를 더 깊게 할 때

| 스킬 | 설치 수 | 특징 |
|---|---|---|
| `wshobson/agents/sql-optimization-patterns` | 1.9만 | EXPLAIN 해석, 인덱스 5종(B-Tree/Hash/GIN/GiST/BRIN), N+1 쿼리 제거, 커서 기반 페이지네이션, 미사용·누락 인덱스 탐지 쿼리를 다룬다. |
| `github/awesome-copilot/postgresql-optimization` | 1.6만 | JSONB, 윈도우 함수, partial 인덱스, `pg_stat_statements` 기반 모니터링을 다룬다. |
| `planetscale/database-skills/postgres` | 8.2K | 인덱스 감사, MVCC/VACUUM 등 문서 구성은 좋다. 다만 PlanetScale 호스팅을 추천하는 내용이 섞여 있다. |
| `jeffallan/claude-skills/postgres-pro`, `database-optimizer` | 7.7K / 5.8K | VACUUM 튜닝, 복제, 설정 튜닝을 다룬다. 보안 검사(Gen Agent Trust Hub)에서 Fail을 받아 권장하지 않는다. |

---

## 4. 피해야 할 것

- `yoanbernabeu/supabase-pentest-*`: 침투 테스트용이다 (anon/service key 추출, RLS 감사 등). 설계나 관리 용도가 아니다.
- `nextjs-supabase-auth`, `supabase-nextjs` 같은 스킬은 프레임워크 연동용이다.

---

## 5. 추천 조합

1. `supabase-postgres-best-practices`: 이미 설치돼 있으니 그대로 쓴다.
2. `supabase`: Supabase CLI/MCP 기반 운영이 필요하면 추가한다.

   ```sh
   npx skills add https://github.com/supabase/agent-skills --skill supabase
   ```

3. `postgresql-table-design`: 설계 기준을 더 엄격하게 잡고 싶으면 추가한다.

   ```sh
   npx skills add https://github.com/wshobson/agents --skill postgresql-table-design
   ```
