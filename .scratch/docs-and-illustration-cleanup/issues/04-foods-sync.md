# 04. foods:sync 개편

Status: resolved
Type: task (prototypes/가 있는 기기에서)
Blocked by: 02 (resolved), 03 (resolved)

## 목적

`pnpm foods:sync` 한 번으로 품종 목록, 웹 SVG, 그림 목록, 경계값, 출처 기록을 만들고, 문제가 있으면 기존 산출물을 지킨다 (명세 결정 9~12).

## 할 일

- [x] 검사를 순수 함수로 빼고 테스트를 먼저 쓴다: 중복 ID, 가리키는 그림의 원본 누락, 제철 검증됐는데 달이 빈 품종(근거가 빈 품종은 개수만 알린다), 옛 ID(`renamed-foods.ts`)와의 충돌, 미검수 그림 참조.
- [x] 내보낼 그림을 "검수 완료이고 품종 원본·이유식 그림 목록·전통 음식·회 데이터 중 하나라도 가리키는 그림"으로 정한다. `CANDIDATE_FOOD_IDS`를 없앤다.
- [x] 임시 폴더에 모두 생성한 뒤 검사하고, 통과하면 한 번에 교체한다. 실패하면 고칠 항목을 품종 ID·그림 ID와 함께 출력하고 0이 아닌 코드로 끝낸다.
- [x] `prototypes/`가 없으면 품종 목록 생성과 검사만 하고 그림 렌더를 건너뛰었다고 출력한다.
- [x] `foods:bounds`는 그대로 둔다. `build:foods` 스크립트는 `foods:sync`로 합치거나 그 일부를 부르게 한다.
- [x] 어드민(06)이 부를 수 있게 생성과 검사를 함수로 내보낸다.

## 완료 기준

- 깨끗한 상태에서 돌리면 산출물이 01의 해시와 같다(의도한 차이는 적는다).
- 품종 원본에 중복 ID를 넣거나 없는 그림을 가리키게 하면 오류가 항목을 짚고, `git status`에 산출물 변경이 없다.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과.

## Comments

2026-11-12: 마쳤다.

- `scripts/sync-foods.mjs`가 `sync-food-images.mjs`를 대신한다. 검사 → `node_modules/.cache/foods-sync`에 생성 → 생성물 확인 → 바뀐 것만 rename으로 교체. 교체하다 실패하면 이미 바꾼 것을 되돌린다.
- 무엇을 내보내고 무엇이 문제인지는 `packages/seasonal/src/data/food-sync-plan.ts`(`planFoodSync`, `duplicateFoodIds`)가 정하고 테스트가 있다.
- 깨끗한 상태에서 돌린 결과: SVG 592 + 19개, `drawn-*`, `food-bounds`의 해시가 01과 같다. `foods.generated.ts`와 두 `PROVENANCE.md`는 머리말의 스크립트 이름 한 줄만 달라졌다.
- 오류 주입: 겹친 품종 ID, 없는 그림을 가리키는 `art`, 미검수 그림을 쓰는 제철 검증 품종, 옛 품종 ID, 대표 달이 제철 달 밖. 모두 항목을 짚고 종료 코드 1, 산출물 해시와 `git status`가 그대로였다.
- **명세와 다르게 한 것**: 품종 ID와 그림 ID가 다른 제철 검증 품종은 웹에 **품종 ID 폴더**로 낸다(그 그림을 그 폴더에 그린다). 화면 코드가 `/foods/<품종 ID>/`로 그림을 찾기 때문에 화면을 고치지 않고 `art`를 쓸 수 있다. 지금은 그런 제철 검증 품종이 없다(새우류는 미검증).
- 어드민(06)은 `pnpm foods:sync --json`을 실행해 `problems`·`notes`·`changed`를 읽으면 된다. 함수 import 대신 명령으로 둔 것은 Next 번들에 `sharp`와 `prototypes/`의 kit을 끌어들이지 않기 위해서다.
- `build:foods`는 품종 목록만 만드는 명령으로 남겼다.

**확인하지 못한 것**: `prototypes/`가 없는 기기의 경로(품종 목록만 다시 만들고 그림은 건너뜀)는 실제로 돌려 보지 않았다. 원본 폴더를 옮겨야 해서 하지 않았고, 계획 함수의 그 분기만 테스트로 확인했다.
