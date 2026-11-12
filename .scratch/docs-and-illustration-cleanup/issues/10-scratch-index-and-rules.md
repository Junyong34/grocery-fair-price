# 10. .scratch 색인과 docs/rules

Status: ready-for-agent
Type: task
Blocked by: 09 (resolved)

## 목적

진행 중인 일을 찾는 입구와 작업 규칙의 자리를 만든다 (명세 결정 22, 29).

## 할 일

- [ ] `.scratch/README.md`: 명세별 한 줄(상태, 미해결 티켓, 이어 받은 명세). 완료 표시가 있어도 미해결 티켓이 있으면 적는다. 상태의 원본은 각 티켓의 `Status:` 줄이라고 밝힌다.
- [ ] `docs/rules/`에 티켓 단위 검증·커밋 규칙을 쓴다: 완료 기준(`pnpm typecheck` · `pnpm lint` · `pnpm test`, 화면은 375 · 1280), 검증한 티켓을 `main`에 직접 커밋, 메시지 형식. 루트 `AGENTS.md`의 해당 블록에서 옮긴다.
- [ ] PR 절차는 쓰지 않는다. 도입할 때 같은 폴더에 더한다는 한 줄만 둔다.
- [ ] `docs/project-structure.md`의 문서 목록에 두 곳을 더한다.

## 완료 기준

`.scratch/README.md`만 읽고 에이전트가 할 수 있는 열린 티켓을 모두 찾을 수 있다.
