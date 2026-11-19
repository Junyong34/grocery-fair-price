# 티켓 단위 검증과 커밋

사람과 에이전트가 함께 따르는 작업 규칙이다. 지금은 **검증한 티켓을 `main`에 바로 커밋**한다. PR 절차는 도입할 때 이 폴더에 문서를 더한다.

티켓과 명세의 위치 · 형식은 `docs/agents/issue-tracker.md`, 지금 열린 일은 `.scratch/README.md`에 있다.

## 1. 티켓 하나가 한 단위다

- 일은 티켓(`.scratch/<기능>/issues/NN-이름.md`) 하나씩 한다. 시작할 때 `Blocked by:`가 모두 풀렸는지 본다.
- 순수 함수(배치, 달력, 검색, 계산)를 쓰거나 고칠 때는 vitest 테스트를 먼저 쓴다. 코드 옆에 `*.test.ts`로 둔다.
- 끝나면 티켓의 체크칸을 채우고 `Status:`를 `resolved`로 바꾼 뒤, `## Comments`에 한 일, 확인한 것, **하지 않았거나 확인하지 못한 것**을 적는다. 다음 티켓이 알아야 할 발견도 여기 적는다.

## 2. 끝났다는 기준

저장소 루트에서 검증한다. 의존성이 없거나 잠금 파일이 바뀌었으면 먼저 `CI=true pnpm install --frozen-lockfile`을 한 번 실행하고 끝날 때까지 기다린다. 검증 중 설치 상태가 어긋나면 명령을 중단하고 설치부터 마친다.

```bash
export CI=true
export pnpm_config_verify_deps_before_run=error
pnpm --filter web exec next typegen
pnpm typecheck
pnpm lint
pnpm test
```

- `pnpm lint`는 오류 0이어야 한다(경고는 남아도 된다).
- `main`에 푸시하면 [코드 검사](../../.github/workflows/check.yml)도 같은 세 명령을 실행한다.
- DB를 건드렸으면 `pnpm db:start` 뒤 `pnpm db:test`도 통과한다.
- 생성 파일을 만드는 입력을 바꿨으면 그 명령으로 다시 만들어 함께 커밋한다(그 파일을 가진 영역의 `AGENTS.md`에 명령이 있다).

**화면을 바꿨으면** 개발 서버와 브라우저로 직접 본다(`next-dev-loop` 스킬, 개발 서버 MCP는 `.mcp.json`). 폭 375와 1280에서 바뀐 화면이 나오고 콘솔 오류와 hydration 경고가 없어야 한다. `/admin` 화면은 1280만 본다.

**규격별 시세를 새로 공개하면** `pnpm --filter @workspace/price-ingest check:spec-prices <품종 slug> [비교 규격 slug]`로 검산한다. 각 규격의 최근 조사에서 원천 금액·수량·단위와 기준 단위 환산가를 한 건 이상 대조하고, 화면의 전국 시세와 조사일을 맞춰 본다. 비교할 기존 규격이 있으면 같은 날 전국 시세도 본다. 예를 들어 `check:spec-prices broiler per-kg`는 호수별 시세와 kg 단위 육계 시세를 대조한다. 3배 차이는 단위를 다시 확인하라는 표시다. 공식 단위와 관측 금액을 확인하고 결과를 기록한 규격부터 금액을 공개한다.

검증하지 못한 것이 있으면 통과한 것처럼 적지 않고 티켓에 그대로 남긴다.

## 3. 커밋

- 티켓 하나를 검증한 뒤 그 티켓의 변경만 `main`에 커밋한다. PR은 만들지 않는다.
- 메시지는 한국어로 `feat: 무엇을 어떻게 바꿨는지(기능/티켓 번호)`. 예: `feat: foods:sync가 검사한 뒤 품종 목록과 그림 산출물을 한 번에 교체함(docs-and-illustration-cleanup/04)`.
- 한 번의 작업에서 다른 티켓의 변경이 섞였으면 커밋을 나눈다.
- `prototypes/`와 `.claude/`는 Git에 없다. 강제로 더하지 않는다.
- 새 클론에서는 한 번 `git config core.hooksPath .githooks`를 실행한다. 커밋 전 비밀값을 검사하고, 카탈로그 입력이 바뀌면 기존 카탈로그 테스트도 실행한다.
