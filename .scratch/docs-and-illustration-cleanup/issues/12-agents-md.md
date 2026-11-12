# 12. 루트와 하위 AGENTS.md

Status: resolved
Type: task
Blocked by: 08 (resolved), 10 (resolved)

## 목적

루트 `AGENTS.md`를 공통 규칙과 요청별 첫 탐색 경로로 줄이고, 영역 규칙을 그 영역에 둔다 (명세 결정 27~30).

## 할 일

- [x] `writing-for-agents` 스킬을 먼저 불러 그 기준으로 쓴다.
- [x] 루트: 공통 규칙, 요청별 첫 탐색 경로(화면 수정 → `apps/web`, 제철 데이터 → `packages/seasonal`, 가격 수집 → `packages/price-ingest`, DB → `supabase`, 문서 정리 → `.scratch/README.md`). 링크마다 어떤 작업에서 읽는지 적는다.
- [x] 루트에 한 줄씩: "`prototypes/`와 `.claude/skills/`는 이 기기에만 있다", "새 품종 그림 요청은 `seasonal-food-illustrator` 스킬로 시작한다".
- [x] 하위 `AGENTS.md` 다섯 곳: `apps/web`, `packages/seasonal`, `supabase`(`packages/price-db` 안내 포함), `packages/price-ingest`, `grocery-price`. 각각 담당 범위, 먼저 읽을 파일, 작업 명령, 검증 기준. 각 위치에 `@AGENTS.md` 한 줄짜리 `CLAUDE.md`.
- [x] `packages/ui`·`packages/price` 규칙과 계층 표는 루트에 남긴다.
- [x] 옮긴 뒤 루트의 `<important if>` 블록 가운데 하위로 간 것을 지우고, 규칙이 빠지지 않았는지 이전 `AGENTS.md`와 한 줄씩 대조한다.
- [x] Turborepo가 관리하는 블록은 그대로 둔다.

## 완료 기준

- 이전 루트 `AGENTS.md`의 규칙이 모두 루트, 하위 다섯 곳, `docs/rules/` 중 한 곳에 있다.
- `apps/web`에서 연 세션이 `apps/web/AGENTS.md`를 읽는다(하위 `CLAUDE.md`로 확인).

## Comments

2026-11-12: 나눴다. 루트는 182줄에서 85줄이 됐다.

- **루트 `AGENTS.md`**: 요청별 첫 탐색 경로 표(화면 → `apps/web`, 제철 · 그림 → `packages/seasonal`, DB → `supabase`, 수집 · 카탈로그 → `packages/price-ingest`, 문서 → `grocery-price`, 가격 도메인 → `packages/price`, 디자인 시스템 → `packages/ui`, 진행 중인 일 → `.scratch/README.md`)와 공통 규칙(용어, 명령, 티켓 · 명세, 레이어 표, UI 컴포넌트 찾는 순서, 색 · 서체)을 둔다. `prototypes/`와 `.claude/skills/`가 이 기기에만 있다는 줄, 생성 파일은 손으로 고치지 않는다는 줄을 넣었다.
- **하위 다섯 곳**에 `AGENTS.md`와 `@AGENTS.md` 한 줄짜리 `CLAUDE.md`를 두었다. 각각 담당 범위, 먼저 읽을 곳(`docs/project-structure.md`의 절), 명령, 검증 기준으로 시작하고 그 영역의 규칙 블록이 이어진다. 생성 파일 표는 파일을 가진 영역으로 나눴다(품종 · 그림 → seasonal, ERD → supabase, API 뷰어 → grocery-price, 서체 · 인쇄물 → apps/web).
- 새로 쓴 규칙 셋: `apps/web`의 어드민 블록(`turbopackIgnore`, 가드, 그림 어드민이 쓰는 파일), `packages/seasonal`의 품종 블록(품종 원본만 고침, 두 판정은 따로, 품종 ID 유지), `packages/price-ingest`의 카탈로그 블록(원본은 DB, ADR 0005).
- 완료 기준 · 커밋 블록과 테스트 먼저 규칙은 `docs/rules/ticket-workflow.md`로 갔고 루트는 언제 읽는지와 함께 가리킨다. 에이전트 셸의 `CI=true`를 루트 명령 블록에 더했다.
- **대조**: 이전 `AGENTS.md`의 `<important if>` 블록 22개가 모두 어딘가에 있는지 스크립트로 확인했고(미배치 0), 줄 단위로 그대로 남지 않은 17줄은 표나 다른 문서로 고쳐 쓴 줄이다. Turborepo 관리 블록과 "대화 방식"은 원문과 바이트까지 같다.
- `apps/web/next.config.ts`의 `agentRules: false` 주석, `docs/project-structure.md`, `nextjs-16-patterns.md`의 AGENTS 언급을 맞췄다.

**확인하지 못한 것**: `apps/web`에서 연 새 세션이 `apps/web/AGENTS.md`를 실제로 읽는지는 돌려 보지 않았다. 하위 `CLAUDE.md`를 두는 것은 Claude Code의 동작에 기대는 것이고, 이 세션에서는 확인할 수 없다. 개발 서버가 떠 있는 동안 `apps/web/AGENTS.md`가 덮어써지지 않는 것은 확인했다.
