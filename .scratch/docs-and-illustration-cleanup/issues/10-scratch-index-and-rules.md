# 10. .scratch 색인과 docs/rules

Status: resolved
Type: task
Blocked by: 09 (resolved)

## 목적

진행 중인 일을 찾는 입구와 작업 규칙의 자리를 만든다 (명세 결정 22, 29).

## 할 일

- [x] `.scratch/README.md`: 명세별 한 줄(상태, 미해결 티켓, 이어 받은 명세). 완료 표시가 있어도 미해결 티켓이 있으면 적는다. 상태의 원본은 각 티켓의 `Status:` 줄이라고 밝힌다.
- [x] `docs/rules/`에 티켓 단위 검증·커밋 규칙을 쓴다: 완료 기준(`pnpm typecheck` · `pnpm lint` · `pnpm test`, 화면은 375 · 1280), 검증한 티켓을 `main`에 직접 커밋, 메시지 형식. 루트 `AGENTS.md`의 해당 블록에서 옮긴다.
- [x] PR 절차는 쓰지 않는다. 도입할 때 같은 폴더에 더한다는 한 줄만 둔다.
- [x] `docs/project-structure.md`의 문서 목록에 두 곳을 더한다.

## 완료 기준

`.scratch/README.md`만 읽고 에이전트가 할 수 있는 열린 티켓을 모두 찾을 수 있다.

## Comments

2026-11-12: `.scratch/README.md`와 `docs/rules/ticket-workflow.md`를 썼다.

- 색인은 네 묶음이다: 진행 중, 끝났지만 열린 티켓이 남은 것, 끝난 것(지금 무엇의 근거로 쓰이는지), 보고서와 조사. 표가 낡을 수 있어 열린 티켓을 다시 찾는 명령을 머리에 두었다.
- 색인의 상태는 티켓의 `Status:` 줄을 그대로 모은 것이다. 줄이 실제와 맞는지는 대조하지 않았다. 예를 들어 `seasonal-render-perf/13`은 커밋 `2eb4fca`가 재측정 결과를 기록했는데 상태는 `ready-for-agent`다. `jangbol-growth`의 열린 10건도 내용을 확인하지 않았다고 표에 적었다.
- 작업 규칙은 루트 `AGENTS.md`의 완료 기준 · 커밋 블록과 테스트 먼저 규칙을 옮기고, 이번에 확인한 두 가지를 더했다: 에이전트 셸에서는 `CI=true`, 확인하지 못한 것은 티켓에 남긴다. 루트 `AGENTS.md`의 원래 블록은 12에서 이 문서를 가리키게 줄인다.
- `docs/project-structure.md` 11장에 두 문서를 연결했다.
