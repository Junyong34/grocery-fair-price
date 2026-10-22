# 13. 원형 판 부품 + 월별 포스터 P-C 열두 달 원형 판

Status: resolved
Blocked by: 01
구성: `month-poster` · `wheel` (P-C)

## 목적

새 부품 **원형 판**(부채꼴 N개, 부채꼴마다 그림 몇 개)을 만들고, 월별 포스터에 `layout: "wheel"`(부채꼴 12개)로 쓴다. 이 부품은 S-C(14)도 쓴다(부채꼴 4개).

## 할 일

- [x] 인터페이스를 먼저 정한다(`mattpocock-skills:codebase-design`). 부채꼴 경계·그림 위치 계산은 `packages/seasonal`의 순수 함수(테스트 먼저: 그림이 부채꼴 밖으로 나가지 않는다), 그리기는 `features/print/parts/`. 10의 막대표와 같은 경계 규칙을 따른다.
- [x] 부채꼴마다 그림 수 상한(`foods.max`)과 달 이름 위치를 정한다. 가로 용지 처리를 정한다(와이어프레임은 세로만).
- [x] 숨길 옵션: `grid`.
- [ ] **A4 한 장을 실제로 인쇄해 글자·그림 크기를 확인**하고 14로 간다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/month-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: P-C를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-23 완료. 실제 종이 인쇄는 하지 않았다(아래 체크 하나 남김).

- 인터페이스(`packages/seasonal/src/print/wheel.ts`, 테스트 먼저): `wheelLayout({ diameter, sectors, counts, core?, band? })` → `{ inner, outer, pictureSize, sectors: [{ start, end, label, slots }] }`. 각도는 12시 방향부터 시계 방향, 좌표는 지름 정사각형 왼쪽 위 원점. 부채꼴마다 고리를 k줄로 나누고(줄마다 하나씩 두고 남은 그림은 넣어도 가장 덜 작아지는 줄에), 그림이 가장 커지는 k를 고른다. 그림 크기는 모든 부채꼴이 같다(가장 빽빽한 곳 × 0.88). 테스트: 12조각·4조각(14번의 봄 12·여름 19·가을 26·겨울 10 포함)에서 그림이 자기 부채꼴 고리·경계선 안, 서로 겹치지 않음, 빈 부채꼴 허용.
- 그리기 `parts/wheel.tsx`의 `Wheel`: SVG 부채꼴(선은 `vector-effect: non-scaling-stroke`로 --line 굵기), 그 위에 그림·표기를 절대 위치로, 가운데 원에 children. 14번은 이것을 그대로 쓴다.
- 10번 막대표와 같은 경계: 계산은 `packages/seasonal`, 그리기는 `features/print/parts`. 와이어프레임 `wheel` 도형과는 나눠 쓰지 않는다.
- 조각마다 그림 상한 4(`foods.max`와 작은 값). A4 세로 그림 한 변 약 10mm. 달 표기는 바깥 띠 가운데 약 12pt. 이름은 넣지 않는다(조각이 좁다).
- 가로 용지: 판 높이를 지름으로 가운데에 둔다(와이어프레임도 두 방향으로 고침). 세로는 판 폭이 지름이라 위아래 여백이 남는다.
- 숨김: `grid`, `foods.names`. 와이어프레임에서 쓰지 않게 된 `memoLines` 도형을 지웠다.
- 확인: A4 세로(흰 바탕)·가로(계절색), A3 세로에서 그림 48개, 원·시트 밖 0. 편집기에서 구성을 고르면 미리보기가 원형 판으로 바뀜, 콘솔 오류 없음. 확인용 에디션은 지웠다.
- 남은 것: "A4 한 장 실제 인쇄"는 사람이 해야 한다. 그림 10mm가 알아볼 만한지 본다.

