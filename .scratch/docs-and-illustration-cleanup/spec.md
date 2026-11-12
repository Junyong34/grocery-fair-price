# 품종 원본 · 그림 어드민 · 문서 정리

Status: ready-for-agent

2026-11-12 질문 라운드(Q1~Q30)로 정한 계획이다. 용어는 `grocery-price/GLOSSARY.md`의 **그림**, **그림 검수**, **제철 검증**을 쓴다. 그림을 품종과 따로 두는 결정은 ADR 0006(`grocery-price/docs/adr/0006-illustration-is-separate-from-variety.md`)에 있다.

## 왜

- 품종의 원본이 Git에 없는 `prototypes/seasonal-food/docs/seasonal-lists/foods.json`이고, 품종과 그림을 이름으로 대조한다. 고칠 곳이 여섯 군데로 흩어져 있다: `foods.json`, `build-foods.mjs`의 `DRAWN_AS`·`NEW_IDS`, `food-season-corrections.json`, `renamed-foods.ts`, `sync-food-images.mjs`의 `CANDIDATE_FOOD_IDS`, `apps/web/features/baby-food/data.ts`의 그림 목록.
- 그림 검수를 마쳤는지 기계가 읽을 곳이 없다. 그림 폴더에 `food.mjs`만 있으면 동기화가 내보낸다.
- 새 그림 한 장을 그려 화면에 올리기까지의 절차가 스킬, 스크립트 주석, 티켓에 나뉘어 있다.
- 문서 감사(`.scratch/docs-audit/report.md`, 2026-11-10)가 낸 이동·삭제 제안이 실행되지 않았다.

## 범위 밖

- `prototypes/`와 `.claude/skills/`의 백업, 다른 기기나 새 클론에서 그림을 이어 그리는 절차. 둘 다 이 기기에만 둔다.
- 그림 크기(`FOOD_SCALE`), 친숙도(`food-familiarity.ts`), 전통 음식 그림, 회 데이터. 지금 위치와 방식 그대로 둔다.
- 이유식 궁합·월령 본문. `infant-pairings.ts`·`infant-fruits.ts`를 직접 고친다.
- 품종 ID 변경과 품종 삭제를 어드민에서 하는 것.

## 확정한 결정

### 품종 원본

1. 손으로 고치는 원본은 `packages/seasonal/src/data/food-registry.json` 하나다. 키는 품종 ID다. 제철 미검증 31종(지금의 `foodnuri` 21, `mof` 10)도 넣는다.
2. 항목은 표시명, 별칭, 카테고리, 제철 달, 대표 달, 제철 검증 상태(`verified`·`unverified`), 근거(출처, 확인일, 사유), 그림 ID(품종 ID와 다를 때만)를 가진다. 지금의 `tier`·`promoted`·`core`는 검증 상태와 근거 출처로 나눠 옮긴다.
3. `food-season-corrections.json`의 보정값은 항목의 달로 합치고 `reason`·`sources`·`checkedAt`은 근거에 그대로 남긴다. 이관 뒤 `foods.json`, 파이썬 스크립트, `DRAWN_AS`, `NEW_IDS`, 보정 파일은 원본이 아니다.
4. `foods.generated.ts`는 원본에서 계속 생성한다. 기존 품종 ID와 `as const` 타입, import 경로는 바뀌지 않는다. 제철달력에는 제철 검증된 품종만 들어간다.
5. 품종 ID는 URL과 먹음 기록의 키다. 바꿀 때는 지금처럼 `renamed-foods.ts`에 옛 ID를 남기고 파일로 고친다.

### 그림

6. 그림은 그림 ID로 따로 존재한다. 제철 품종, 이유식 재료, 전통 음식, 회가 각자 그림 ID를 가리킨다. 제철에 없는 이유식 재료는 품종 원본에 넣지 않는다.
7. 그림 검수 상태는 `prototypes/seasonal-food/foods/<id>/art.json`에 둔다(그림 ID, 표시명, 검수 상태, 검수일, 참고 출처). `NOTES.md`는 사람이 읽는 관찰 기록으로 둔다. 기존 그림은 "이미 웹에 나간 것은 검수 완료, 나머지는 미검수"로 한 번에 채운다.
8. 이유식 화면의 그림 목록(`FRUIT_GUIDE_ART`·`PAIRING_ART`)은 `apps/web/features/baby-food/data.ts`에서 `packages/seasonal`로 내린다. 어드민이 쓰므로 JSON으로 둔다.
9. 웹에 내보내는 그림은 **그림 검수를 마쳤고 어느 화면 데이터든 가리키는 그림**이다. `CANDIDATE_FOOD_IDS`는 없앤다. 화면 데이터가 미검수 그림이나 없는 그림을 가리키면 동기화가 오류로 알린다.

### 동기화

10. `pnpm foods:sync` 한 번이 품종 목록, 웹 SVG, 그림 목록, 경계값, 출처 기록을 만든다.
11. 임시 폴더에 전부 생성하고 검사한 뒤 한 번에 교체한다. 검사: 중복 ID, 가리키는 그림의 원본 누락, 제철 검증됐는데 달이 빈 품종, 옛 ID와의 충돌, 미검수 그림 참조. 근거가 빈 제철 검증 품종은 오류가 아니라 개수로 알린다(옛 자료에서 옮긴 110종이 그렇다, 02의 Comments). 하나라도 걸리면 고칠 항목을 목록으로 출력하고 기존 파일은 그대로 둔다.
12. `prototypes/`가 없으면 품종 목록 생성과 검사까지만 하고 그림 렌더는 건너뛰었다고 알린다.

### 그림 어드민

13. 개발 서버 전용 `/admin` 아래에 둔다(운영 404, 1280 폭 기준). 인쇄물 어드민처럼 로컬에서 저장소 파일을 직접 쓴다.
14. 그림은 저장소의 웹 SVG가 아니라 `prototypes/`의 원본을 렌더해 보여 준다. 새 그림은 용도가 정해지기 전까지 웹에 없기 때문이다.
15. 사용자가 그림 검수를 판정하고 용도(제철, 이유식)를 정한다. 저장하면 `art.json`, 품종 원본, 이유식 그림 목록을 쓴다.
16. 제철로 지정하거나 제철 달을 고칠 때 근거 출처와 확인일을 반드시 받는다. 옛 자료에서 옮긴 품종은 근거가 비어 있어도 그대로 둔다. 비워 두면 제철 미검증으로만 저장되고 제철달력에 나가지 않는다.
17. "웹에 반영" 버튼은 `pnpm foods:sync`와 같은 생성과 검사를 돌린다. 터미널 명령도 그대로 쓸 수 있다.
18. 기존 품종 편집(표시명, 별칭, 카테고리, 제철 달, 대표 달, 근거, 연결된 그림)은 어드민 묶음의 마지막 티켓이다. 달력에서 빼려면 제철 미검증으로 내린다.

### 새 그림 한 장의 흐름

19. 프롬프트 "XX 품종 그림을 그려 줘. 체크리스트와 특징을 문서에 적고 스킬로 그린 뒤 동기화까지"가 한 번에 끝까지 간다. 에이전트 턴: 그림 ID 발번(기존 ID·옛 ID와 겹치지 않게) → `NOTES.md`에 특징과 체크리스트 기입 → `seasonal-food-illustrator`로 작도 → `art.json`을 미검수로 생성 → 미리보기 렌더 → 어드민 주소 안내. 중간에 멈추지 않는다.
20. 사용자 턴(어드민): 그림 검수 → 용도 지정 → 웹에 반영. 에이전트는 제철을 조사하거나 등록하지 않고, 남은 절차만 제안한다.
21. 이 절차의 원본은 스킬의 `SKILL.md`다. 루트 `AGENTS.md`에는 "새 품종 그림 요청은 이 스킬로 시작한다"는 한 줄만 둔다.

### 문서

22. `.scratch`는 진행 중인 명세와 티켓의 입구다. 완료된 명세는 옮기지 않는다(화면 명세로 계속 인용된다). `.scratch/README.md`에 명세별 상태와 미해결 티켓 색인을 둔다.
23. 계속 참고할 동작과 운영 절차만 담당 영역 문서로 옮긴다. 프로젝트 구조는 `docs/project-structure.md`, 장기 결정은 ADR.
24. 삭제는 세 조건을 모두 채울 때만 한다: 대체 문서가 있다, 고유한 결정이나 출처가 남아 있지 않다, 참조를 정리할 수 있다. Markdown 링크뿐 아니라 코드 주석, 스크립트, 데이터에 적힌 경로까지 찾는다. 미해결 티켓과 다른 곳이 인용하는 연구 자료는 지우지 않는다.
25. 감사는 `.scratch/docs-audit/report.md`를 기준선으로 삼고, 2026-11-10 이후 변경분과 그 보고서가 다루지 않은 `prototypes/`·스킬·코드 주석 속 경로만 더 본다.
26. 루트 `README.md`는 장볼날을 처음 보는 사람을 위한 서비스 소개다(시세·가격 판정, 제철달력과 먹음 기록, 이유식 궁합, 인쇄물 다운로드). 개발 구조와 명령은 `docs/project-structure.md`로 연결한다.

### 에이전트 안내

27. 루트 `AGENTS.md`에는 공통 규칙과 요청별 첫 탐색 경로를 둔다. 링크마다 어떤 작업에서 읽는지 적는다. `writing-for-agents` 스킬로 쓴다.
28. 하위 `AGENTS.md`는 다섯 곳에 둔다: `apps/web`, `packages/seasonal`, `supabase`(`packages/price-db` 안내 포함), `packages/price-ingest`, `grocery-price`. 각 위치에 `@AGENTS.md` 한 줄짜리 `CLAUDE.md`를 함께 둔다(Claude Code는 하위 `AGENTS.md`를 읽지 않는다). `packages/ui`와 `packages/price`의 규칙은 루트에 남긴다.
29. `docs/rules/`에 티켓 단위 검증·커밋 규칙을 둔다(검증한 티켓을 `main`에 직접 커밋). PR 절차는 도입할 때 같은 폴더에 더한다. `docs/agents/`는 그대로 둔다.
30. 루트 `AGENTS.md`에 "`prototypes/`와 `.claude/skills/`는 이 기기에만 있다"를 한 줄로 적는다.

## 실행 순서와 티켓

| 단계 | 티켓 | 내용 | 막는 것 |
|---|---|---|---|
| ① 기준값 | 01 | 현재 산출물과 개수를 기록 | 없음 |
| ② 원본·동기화 | 02 | 품종 원본으로 이관 | 01 |
| | 03 | `art.json` 채우기, 이유식 그림 목록 내리기 | 01 |
| | 04 | `foods:sync` 개편 | 02, 03 |
| ③ 그림 어드민 | 05 | 그림 목록과 그림 검수 | 03 |
| | 06 | 용도 지정과 웹에 반영 | 04, 05 |
| | 07 | 기존 품종 편집 | 06 |
| ④ 스킬 | 08 | 새 그림 한 장 절차 | 06 |
| ⑤ 문서 | 09 | 문서 정리표 실행 | 04 |
| | 10 | `.scratch/README.md`, `docs/rules/` | 09 |
| ⑥ 안내 | 11 | 루트 `README.md` | 07, 08 |
| | 12 | 루트와 하위 `AGENTS.md` | 08, 10 |

02~04는 한 묶음으로 검증한다: 이관 전후의 `foods.generated.ts`와 웹 SVG가 01의 기준값과 같아야 한다(의도한 차이는 티켓에 적는다).

## 문서 정리표

09가 실행했다(2026-11-12). 근거의 "감사"는 `.scratch/docs-audit/report.md`다. 삭제는 세 조건(대체 문서 있음, 고유한 결정·출처 없음, 참조 정리 가능)을 모두 채운 것만 했다.

| 현재 경로 | 조치 | 근거 | 대체 경로 | 결과 |
|---|---|---|---|---|
| `prototypes/seasonal-food/docs/seasonal-lists/foods.json` | 원본에서 내림(파일은 둠) | 결정 1·3 | `packages/seasonal/src/data/food-registry.json` | 함(02). `prototypes/` README에 더는 원본이 아니라고 적음 |
| `packages/seasonal/src/data/food-season-corrections.json` | 삭제 | 결정 3. 값과 근거를 모두 옮김 | 품종 원본의 근거 필드 | 함(02). 보정 7종의 사유 · 출처 · 확인일이 품종 원본에 있는지 테스트가 본다 |
| `packages/seasonal/scripts/build-foods.mjs` | 통합 | 결정 10 | `pnpm foods:sync` | 함(02 · 04). `DRAWN_AS`·`NEW_IDS`·`--refresh-seasons`를 없앴고, 품종 목록만 만드는 명령으로 남김 |
| `scripts/sync-food-images.mjs` | 삭제 | 결정 10·11 | `scripts/sync-foods.mjs` | 함(04) |
| `apps/web/features/baby-food/data.ts`의 `FRUIT_GUIDE_ART`·`PAIRING_ART` | 이동 | 결정 8 | `packages/seasonal/src/data/infant-art.json` | 함(03). 앱은 그림 ID를 경로로 바꿔 쓴다 |
| `.scratch/sashimi/issues/07-dageumbari-alias.md` | 고침 | 할 일이 `foods.json`을 가리켰다 | 품종 원본 | 함(02), 이어서 어드민으로 끝냄(07) |
| `.scratch/seo/issues/08-food-content-depth.md` | 고침 | 품종별 출처를 `foods.json`의 필드로 적었다 | 품종 원본의 `evidence` | 함(02) |
| `.scratch/food-months/` | 유지 | `renamed-foods.ts`가 인용한다(감사 3장) | 없음 | 그대로 |
| `docs/food-pairing-image-analysis.md` | 이동 | 판독 원자료이고 데이터는 `infant-pairings.ts`에 있다(감사 2장) | `.scratch/infant-food-pairing/image-analysis.md` | 함. `infant-pairings.ts` 주석과 infant-food-pairing 명세 · 티켓 01의 경로를 고침. 문서가 가리키는 첨부(`.codex-attachments/…jpg`)는 저장소에 없다고 머리에 적음 |
| `apps/web/DESIGN.md`의 Oura 사이트 분석 부분 | 이동 → **안 함**, 안내를 더함 | 장볼날 규칙은 네 절뿐이고 분석 부분은 다크 표면을 설명한다(감사 2장) | 같은 파일 | 옮기지 않았다. `globals.css` 주석 2곳, 가격 화면 주석 2곳, 명세 2곳이 `DESIGN.md`를 규칙의 자리로 가리키고, 머리의 YAML(`name: Oura Analysis`)이 분석과 한 묶음이라 떼면 형식이 깨진다. 대신 머리에 "읽는 법"을 달아 어느 절이 규칙인지 밝혔다 |
| `.scratch/catalog-evolution/` | 유지 | catalog-scale 11·12·09가 `plans/01`·`04`·`06`을 인용한다 | 없음 | 그대로 |
| `.scratch/p2-data-source-spec/issues/11` | 닫기(`wontfix`) | 로드맵이 4단계로 바뀌었다(감사 3장) | 없음 | 함 |
| `docs/agents/issue-tracker.md`, `domain.md` | 고침 | 없는 스킬 이름과 규칙 밖 티켓 상태(감사 2장) | 같은 파일 | 함. `/improve-codebase-architecture` → `/codebase-design`. `/grill-with-docs`는 지금 설치돼 있어 그대로. `/wayfinder`는 설치돼 있지 않다고 적고 배치 규칙은 남김(두 폴더가 쓴다). 상태 값은 다섯 역할 + `claimed` · `resolved` · `open`(wayfinder)으로 적음 |
| 티켓의 `Status: done` 7건, `in-progress` 2건 | 고침 | 위와 같음 | 같은 파일 | 함. `done` → `resolved`(baby-food-ingredient-pages 01~03, catalog-scale 05·08·09·10), `in-progress` → `claimed`(catalog-scale 06·07). `open` 12건은 wayfinder 티켓이라 그대로 |
| `.scratch/infant-food-pairing/issues/01` | 유지 | `needs-info`. 그림이 없던 이름 28개는 그 뒤 모두 그려져 궁합 재료 97개가 전부 그림에 연결됐다. "범위 · 부위 · 형태 검토 필요 12개"는 사람의 판단이 남아 있다 | 없음 | 그대로. 현재 상태를 Comments에 적음 |
| `grocery-price/README.md`, `roadmap.md`의 현재 단계 | 고침 → **안 함** | "운영 배포가 남음"이 실제와 다르다(감사 2장) | 같은 파일 | 하지 않았다. "운영 배포"가 색인 켜기 · sitemap 제출을 뜻하는지, 축평원 백필 실패 3묶음을 어떻게 적을지 사용자의 확인이 필요하다 |
| 루트 `AGENTS.md`의 완료 기준 · 커밋 블록 | 이동 | 결정 29 | `docs/rules/` | 10에서 |
| 루트 `AGENTS.md`의 영역별 블록 | 이동 | 결정 28 | 하위 `AGENTS.md` 다섯 곳 | 12에서 |
| 루트 `AGENTS.md`의 생성 파일 표 중 품종 · 그림 행 | 고침 | 결정 10 | 같은 표 | 함(04). 12에서 `packages/seasonal/AGENTS.md`로 옮긴다 |
| `.claude/skills/seasonal-food-illustrator/` | 고침 | 결정 19~21 | 같은 폴더 | 함(08). Git에 없다 |

옛 경로(`seasonal-lists/foods.json`, `sync-food-images`, `CANDIDATE_FOOD_IDS`, `NEW_IDS`, `DRAWN_AS`, `food-season-corrections`, `--refresh-seasons`, `food-pairing-image-analysis`)를 `.ts` · `.tsx` · `.mjs` · `.md` · `.json`에서 찾아 남은 곳은 다음뿐이다: 이 명세와 티켓, 감사 보고서, ADR 0006(이전 방식 설명), `docs/project-structure.md`의 이관 경위 한 줄, 끝난 티켓의 기록(seasonal-mvp 01·02와 명세, sashimi 06). 끝난 티켓은 그때의 사실이라 고치지 않았다.

## 완료 기준

- `pnpm foods:sync` 한 번으로 품종 목록, 웹 SVG, 그림 목록, 경계값, 출처 기록이 만들어지고, 일부러 넣은 오류(중복 ID, 없는 그림 참조)에서 기존 파일이 바뀌지 않는다.
- 품종의 표시명, 별칭, 제철 달, 근거를 고칠 곳이 품종 원본 한 곳이다.
- 프롬프트 한 줄로 새 그림이 미리보기까지 만들어지고, 어드민에서 검수와 용도 지정을 마치면 웹에 나온다. 제철 근거 없이 저장한 그림은 제철달력에 없다.
- 문서 정리표의 모든 행이 실행됐거나 하지 않은 이유가 적혀 있고, 옮기거나 지운 경로를 가리키는 참조가 남아 있지 않다.
- 루트에서 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test`가 통과한다. 어드민 화면은 1280 폭에서 콘솔 오류 없이 동작한다.
