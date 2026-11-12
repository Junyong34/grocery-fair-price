# 12. 루트와 하위 AGENTS.md

Status: ready-for-agent
Type: task
Blocked by: 08 (resolved), 10

## 목적

루트 `AGENTS.md`를 공통 규칙과 요청별 첫 탐색 경로로 줄이고, 영역 규칙을 그 영역에 둔다 (명세 결정 27~30).

## 할 일

- [ ] `writing-for-agents` 스킬을 먼저 불러 그 기준으로 쓴다.
- [ ] 루트: 공통 규칙, 요청별 첫 탐색 경로(화면 수정 → `apps/web`, 제철 데이터 → `packages/seasonal`, 가격 수집 → `packages/price-ingest`, DB → `supabase`, 문서 정리 → `.scratch/README.md`). 링크마다 어떤 작업에서 읽는지 적는다.
- [ ] 루트에 한 줄씩: "`prototypes/`와 `.claude/skills/`는 이 기기에만 있다", "새 품종 그림 요청은 `seasonal-food-illustrator` 스킬로 시작한다".
- [ ] 하위 `AGENTS.md` 다섯 곳: `apps/web`, `packages/seasonal`, `supabase`(`packages/price-db` 안내 포함), `packages/price-ingest`, `grocery-price`. 각각 담당 범위, 먼저 읽을 파일, 작업 명령, 검증 기준. 각 위치에 `@AGENTS.md` 한 줄짜리 `CLAUDE.md`.
- [ ] `packages/ui`·`packages/price` 규칙과 계층 표는 루트에 남긴다.
- [ ] 옮긴 뒤 루트의 `<important if>` 블록 가운데 하위로 간 것을 지우고, 규칙이 빠지지 않았는지 이전 `AGENTS.md`와 한 줄씩 대조한다.
- [ ] Turborepo가 관리하는 블록은 그대로 둔다.

## 완료 기준

- 이전 루트 `AGENTS.md`의 규칙이 모두 루트, 하위 다섯 곳, `docs/rules/` 중 한 곳에 있다.
- `apps/web`에서 연 세션이 `apps/web/AGENTS.md`를 읽는다(하위 `CLAUDE.md`로 확인).
