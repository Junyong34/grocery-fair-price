# 개발 → 배포 절차 (브랜치 · 커밋 · PR · 머지)

Status: ready-for-human (PR 템플릿 · 커밋 type 초안을 관리자가 확인하면 ready-for-agent)

## 왜

Vercel이 main push마다 운영 배포를 한다. 지금까지는 main에 바로 커밋 · push했다(AGENTS.md "Commit each verified ticket straight to `main`, no PR"). 이제 main push 한 번이 곧 운영 반영이라, 확인 안 된 변경이 바로 사용자에게 나간다.

## 지금 상태 (2026-11-04 확인)

- 커밋 409개, 모두 main에 직접. 형식은 `type: 한국어 한 줄`, 본문 없음. 쓰인 type: `feat`, `fix`, `refactor`, `docs`, `perf`. 대부분 `feat`라서 문서 작업도 `feat`로 적힌 경우가 많다(예: `feat: 장볼날 PDF 유입과 가격 연결 결정 지도 작성`).
- main 브랜치 보호 없음. GitHub 머지 방식은 squash · merge commit · rebase 모두 켜짐, 머지 뒤 브랜치 자동 삭제 꺼짐.
- `.github/workflows/`는 수집 4개(kamis · ekape · chamga · heartbeat)뿐. PR에서 typecheck · lint · test를 돌리는 CI가 없다. PR을 막는 건 Vercel 빌드 하나뿐이다.
- pre-commit 훅은 비밀값 검사(`scripts/check-no-secrets.sh`)만 한다.

## 정한 것

| 항목 | 결정 |
|---|---|
| 규칙 위치 | `docs/agents/rules/` 아래 파일 넷. AGENTS.md에는 `<important if>` 블록으로 연결만 둔다 (아래 "만들 파일") |
| 브랜치 이름 | `JANGBOL-<번호>-<키워드>`. 키워드는 영어 kebab-case 2~4단어 (예: `JANGBOL-12-price-search-empty`) |
| 번호 | 전역 순번. 로컬 브랜치, 원격 브랜치, 지금까지의 PR head 브랜치에 있는 `JANGBOL-N` 중 가장 큰 값 + 1. 없으면 1 |
| 커밋 메시지 | 지금 형식 유지: `type: 한국어 한 줄`. type은 실제 내용에 맞게 고른다 |
| PR 생성 | 사용자가 "PR 올려줘"라고 할 때만. `gh pr create` |
| 머지 | 관리자(사람)만. 에이전트는 머지하지 않는다 |
| 머지 방식 | 작업 브랜치 → main 또는 target: **squash**. target → main: **merge commit** |
| 강제 장치 | PR CI 워크플로(typecheck · lint · test), PR 템플릿 파일, main GitHub Ruleset(아래). Claude Code 훅으로 에이전트의 main push를 막는 것은 하지 않는다 |
| main Ruleset | force push 금지 · 삭제 금지(예외 없음), 머지 전 CI 통과 필수, PR 필수(관리자 bypass "Always"). 리뷰 승인 필수 · 선형 히스토리 필수는 끈다(혼자라 승인자가 없고, target → main merge commit과 충돌). 관리자 bypass라 에이전트의 main 직접 push는 막지 못한다 |
| target 브랜치 | 이름을 따로 구분하지 않는다. 작업 브랜치와 같은 `JANGBOL-N-<키워드>`이고, 어느 브랜치가 target인지는 사용자가 그때 말한다 |
| Vercel 미리보기 | 쓰지 않는다. `vercel.json`으로 main 말고는 배포하지 않는다. 화면 확인은 로컬 dev 서버(375 · 1280) |
| 앱과 상관없는 push | `vercel.json` `ignoreCommand`로 앱 빌드에 들어가는 경로가 안 바뀐 push는 빌드를 건너뛴다. 그래서 문서 · `.scratch`만 바꾸는 작업은 묻지 않고 main에서 바로 한다 |
| 머지한 브랜치 | GitHub "머지 뒤 브랜치 자동 삭제"를 켠다 |
| DB 마이그레이션 | 운영 DB에는 지금처럼 로컬에서 `pnpm exec supabase db push`로 직접 넣는다(Vercel은 DB를 안 바꾼다). 순서: **더하는 변경(새 표 · 열 · 함수)은 DB 먼저, 머지는 그다음. 지우거나 이름 바꾸는 변경은 코드 먼저 배포, DB는 그다음** |

## 절차

### 1. 작업 시작

1. 파일을 바꾸는 작업을 시작할 때 현재 브랜치를 본다. 질문 · 조사 · 읽기만 하는 작업은 묻지 않는다. 바뀌는 파일이 모두 앱 빌드 밖(`ignoreCommand`가 건너뛰는 경로: `.scratch/`, `docs/`, `grocery-price/` 등)이면 묻지 않고 main에서 한다.
2. 현재 브랜치가 `main`이면 "새 브랜치를 만들어 작업할까요?"를 한 번 묻는다. 한 작업에서 한 번만 묻고, 같은 작업 안에서 다시 묻지 않는다.
   - **아니오** → main에서 그대로 작업한다. 커밋 · push는 바로 운영 배포가 된다는 것을 응답에 한 줄 적는다.
   - **예** → 아래 3번.
3. 브랜치 만들기
   - 번호: `git fetch --prune` 뒤 `git branch -a`와 `gh pr list --state all --limit 500 --json headRefName`에서 `^JANGBOL-(\d+)-`를 뽑아 최댓값 + 1.
   - 키워드: 작업 내용에서 2~4단어를 영어 kebab-case로. 소문자, 숫자, `-`만.
   - 기준: 따로 말이 없으면 최신 `origin/main`. target 브랜치에 모을 작업이면 그 target에서 만든다.
   - 만들 이름을 응답에 보여 주고 바로 만든다(따로 확인받지 않는다).
4. 시작할 때 커밋하지 않은 변경이 있으면 새 브랜치로 그대로 따라온다. 이번 작업과 관계없는 변경이 섞여 있으면 브랜치를 만들기 전에 알린다.

### 2. 작업 중

- 확인 기준은 지금과 같다: `pnpm typecheck` · `pnpm lint`(오류 0) · `pnpm test`, 화면 변경은 375 · 1280 확인.
- 확인된 단위마다 커밋하고 브랜치를 push한다. 브랜치 push는 배포되지 않는다(미리보기 꺼짐).
- 작업 브랜치에서는 force push를 하지 않는다(squash 머지라 히스토리 정리가 필요 없다).

### 3. PR 올리기 ("PR 올려줘")

1. 확인 명령 3개를 다시 돌리고 통과했을 때만 올린다. 실패하면 결과를 보여 주고 멈춘다.
2. base: 사용자가 target을 말하면 그 브랜치, 아니면 `main`.
3. 제목: 커밋 메시지와 같은 형식 `type: 한국어 한 줄`. squash 머지하면 이 제목이 base의 커밋 메시지가 된다(GitHub가 끝에 `(#PR번호)`를 붙인다).
4. 본문: `.github/pull_request_template.md` 양식을 채운다(초안은 아래).
5. `gh pr create --base <base> --title "<제목>" --body-file <임시 파일>`. 만든 뒤 PR 주소를 알려 준다.

### 4. 머지 · 배포 (관리자)

- **바로 배포할 작업**: PR base `main` → CI 통과 · 변경 확인 → (DB를 더하는 변경이면 `supabase db push` 먼저) → squash 머지 → Vercel 운영 배포 → (DB를 지우는 변경이면 이제 `supabase db push`).
- **여러 작업을 모아 배포**:
  1. target 브랜치를 main에서 만든다. 이름은 작업 브랜치와 같은 규칙이다.
  2. 작업 브랜치마다 PR base를 target으로 두고 squash 머지한다.
  3. main이 그사이 바뀌면 target에 main을 merge해서 맞춘다(rebase 안 함).
  4. 다 모이면 target → main PR을 만들고 **merge commit**으로 머지한다. 이 PR 본문에는 모은 PR 목록을 적는다.
- 머지한 브랜치는 지운다.
- 되돌리기: Vercel의 이전 배포로 Instant Rollback을 먼저 하고, 그다음 `git revert`로 main을 맞춘다.

## 만들 파일

| 파일 | 내용 |
|---|---|
| `docs/agents/rules/branching.md` | 1번 절차: 언제 묻는지, 이름 · 번호 규칙, 기준 브랜치 |
| `docs/agents/rules/commits.md` | type 목록과 고르는 기준, 한 줄 규칙, 예시 |
| `docs/agents/rules/pull-requests.md` | 3번 절차, 제목 규칙, base 고르기, 템플릿 채우는 법 |
| `docs/agents/rules/release.md` | 4번 절차: 머지 방식, target 흐름, 되돌리기, 배포 전 확인 목록 |
| `.github/pull_request_template.md` | PR 본문 양식 |
| `.github/workflows/ci.yml` | `pull_request`에서 install → typecheck → lint → test |
| `vercel.json` (Vercel Root Directory 위치) | `git.deploymentEnabled`로 main 말고는 배포 끄기, `ignoreCommand`로 앱과 상관없는 push 건너뛰기 |
| `AGENTS.md` | 47행 "straight to main, no PR"을 지우고, `<important if="you are starting a change, committing, pushing, or opening a PR">` 블록으로 위 파일들을 연결 |
| `docs/project-structure.md` | `docs/agents/rules/`, 새 워크플로, PR 템플릿 추가 |

### 커밋 type (초안)

| type | 쓰는 때 |
|---|---|
| `feat` | 사용자가 보는 기능 · 화면 · 문구가 바뀜 |
| `fix` | 잘못 동작하던 것을 고침 |
| `refactor` | 동작은 같고 구조만 바뀜 |
| `perf` | 성능 |
| `docs` | 문서 · 스펙 · 이슈 파일만 바뀜 |
| `chore` | 설정, 의존성, 빌드, CI, 생성 파일만 다시 만듦 |
| `test` | 테스트만 더하거나 고침 |

메시지는 지금처럼 한 줄 한국어. 이유나 세부가 필요하면 지금처럼 `: ` 뒤에 이어 쓴다. 브랜치 번호는 메시지에 넣지 않는다(브랜치 이름과 PR에 있다).

### PR 템플릿 (초안. 고쳐 쓰세요)

```markdown
## 요약
<!-- 무엇을, 왜. 두세 줄 -->

## 관련 문서
<!-- .scratch/<feature>/spec.md, issues/NN-slug.md, ADR 등. 없으면 "없음" -->

## 바뀐 것
-

## 화면
<!-- 화면이 바뀌면 로컬에서 찍은 375 · 1280 캡처. 없으면 "화면 변경 없음" -->

## 확인한 것
- [ ] `pnpm typecheck`
- [ ] `pnpm lint` (오류 0)
- [ ] `pnpm test`
- [ ] 화면: 375 · 1280에서 콘솔 오류 · hydration 경고 없음
- [ ] DB 변경 시 `pnpm db:test`

## 배포 영향
<!-- 해당하는 것만 남기고 내용을 적는다. 하나도 없으면 "없음" -->
- [ ] DB 마이그레이션: 더하는 변경이면 머지 **전**에, 지우거나 이름 바꾸는 변경이면 배포 **후**에 `pnpm exec supabase db push`
- [ ] 환경변수 추가 · 변경 (Vercel 설정, `turbo.json` `build.env` 목록)
- [ ] 생성 파일 다시 만듦 (어떤 명령으로)
- [ ] 새 페이지 · 주소 변경 (`shared/seo/pages.ts`, `proxy.ts` matcher)
- [ ] 분석 이벤트 · 파라미터 추가 (GA 등록)
- [ ] 인쇄물 · R2 업로드

## 되돌리기
<!-- 문제가 생기면 어떻게 되돌리나. 보통 "Vercel 이전 배포로 롤백 + revert". DB 변경이 있으면 따로 적는다 -->

## 리뷰할 곳
<!-- 관리자가 특히 봐야 할 파일이나 판단 -->
```

### CI 워크플로 (초안)

- 트리거: 모든 `pull_request` (target 이름을 구분하지 않으므로 base로 거르지 않는다).
- 단계: checkout → pnpm · Node 24 → `pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm lint` → `pnpm test`.
- `pnpm db:test`는 로컬 Supabase가 필요해서 이번에는 넣지 않는다.
- 비밀값을 넘기지 않는다. `pnpm test`가 DB나 `prototypes/` 없이 도는지 먼저 확인한다(못 돌면 무엇이 막는지 이슈로 남긴다).

## 구현 전 확인할 것

- Vercel 대시보드의 Root Directory(`apps/web`인지). `vercel.json` 위치와 `ignoreCommand`의 경로 기준이 여기에 따라 바뀐다.
- `ignoreCommand`가 보는 경로: `apps/web/`, `packages/`, 루트 `package.json` · `pnpm-lock.yaml` · `pnpm-workspace.yaml` · `turbo.json`. 이 중 하나라도 바뀌면 빌드한다. `apps/web/docs/`도 앱 폴더 안이라 빌드 대상이다(정확히 빼려면 따로 제외).
- `git.deploymentEnabled`가 브랜치 이름 와일드카드(`JANGBOL-*`)를 받는지 Vercel 문서로 확인한다. 안 되면 대시보드의 Git 설정에서 미리보기를 끈다.
- `pnpm test`가 DB나 `prototypes/` 없이 CI에서 도는지.

## 티켓 (`issues/`로 나눔)

1. `docs/agents/rules/` 파일 넷과 AGENTS.md 연결, project-structure 갱신
2. `.github/pull_request_template.md`
3. `.github/workflows/ci.yml` (`pnpm test`가 CI에서 도는지 확인 포함)
4. `vercel.json`: main 말고는 배포 끄기, 앱과 상관없는 push 빌드 건너뛰기
5. GitHub 설정: squash · merge commit만 켜기(rebase 끄기), 머지 뒤 브랜치 자동 삭제
6. GitHub Ruleset(main): force push · 삭제 금지, CI 필수(3번 뒤), PR 필수 + 관리자 bypass "Always". 켠 뒤 문서만 바꾼 커밋을 main에 직접 push해 bypass가 되는지, `push -f`가 막히는지 확인
7. 첫 실전: 이 작업 자체를 `JANGBOL-1-dev-workflow` 브랜치로 진행하고 PR로 머지해 절차를 한 번 돌려 본다

## 솔직한 평가

이 계획 점수는 7.5/10입니다 (미리보기를 끄고 빌드 건너뛰기를 넣어 1차보다 운영 사고 경로가 줄었다).

- 좋은 점: 혼자 개발하는 규모에 맞게 가볍고, 운영 배포 전에 Vercel 미리보기와 사람 확인이 한 번 들어갑니다.
- 약한 점 1: Ruleset은 관리자 bypass라서, 본인 계정으로 push하는 에이전트가 main에 앱 코드를 바로 올리는 것은 막지 못합니다. 이 부분은 규칙 문서에만 기대고 있습니다. 실제로 사고가 나면 Claude Code 훅(main에 앱 경로가 담긴 push는 확인받기)을 다시 검토합니다.
- 약한 점 2: 묻는 방식은 귀찮으면 "아니오"로 흘러갑니다. 문서 작업을 묻지 않게 해 덜어 냈지만, 코드 작업에서 "아니오"가 잦으면 규칙을 다시 본다.
- 약한 점 3: 전역 순번은 두 세션이 동시에 브랜치를 만들면 겹칠 수 있습니다. 혼자 쓰면 드문 일이라 받아들일 만합니다.
- target 묶음 배포는 혼자 개발할 때 거의 안 쓰게 될 수 있습니다. 규칙은 두되, 쓸 일이 생길 때까지 CI 트리거 말고는 따로 만들지 않습니다.
- 미리보기를 끄면 운영과 같은 빌드 · 환경변수로 확인할 곳이 없어집니다. 환경변수나 `next.config` 변경은 로컬에서 `pnpm build && next start`까지 돌려 봐야 합니다.
