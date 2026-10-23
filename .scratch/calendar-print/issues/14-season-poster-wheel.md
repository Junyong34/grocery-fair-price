# 14. 계절 포스터 S-C 사계절 원형 판

Status: resolved
Blocked by: 01, 13
구성: `season-poster` · `wheel` (S-C)

## 목적

계절 포스터에 `layout: "wheel"`(부채꼴 4개)을 더한다. 13의 원형 판 부품을 쓴다.

## 할 일

- [x] 13의 부품을 그대로 쓴다. 부채꼴이 커서 그림이 많이 들어가므로 배치가 고르게 되는지 본다.
- [x] `seasonLabel` 위치(부채꼴 안 / 바깥 둘레)를 정한다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/season-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: S-C를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-23 완료. 실제 종이 인쇄는 하지 않았다.

- 두 방향 모두(세로는 판 폭, 가로는 판 높이가 지름, 가운데 정렬). 12시부터 시계 방향으로 봄·여름·가을·겨울, 부채꼴마다 그 계절 품종(`foods.max`, 기본 24). 이름은 넣지 않는다(`foods.names` 숨김). 가운데에 "사계절 / 제철 음식". 바탕 `season`이면 부채꼴마다 계절색.
- `seasonLabel` 위치: **바깥 둘레(원 밖 판 모서리)**. 부채꼴이 90°라 바깥 띠에 가로 글자를 쓰면 원 밖으로 삐져나온다. 그래서 띠를 0.02로 줄여 그림 고리를 넓히고, 계절 이름을 원을 감싼 정사각형 모서리(봄 오른쪽 위, 여름 오른쪽 아래, 가을 왼쪽 아래, 겨울 왼쪽 위)에 A4 약 23pt로 쓴다(영문은 위에 작게). `Wheel`의 `label`은 선택으로 바꿨다.
- 배치: 그림 있는 품종 65개(가을이 24개로 막힘)가 부채꼴마다 고르게 퍼진다. 그림 한 변은 가장 빽빽한 가을에 맞춰 A4 세로 12.8mm, 가로 11.3mm, A3 세로 18.1mm. 계절 이름과 원 사이는 A4 가로에서도 14mm 이상 띄워진다. 세 경우 모두 용지 밖으로 넘치는 요소 없음.
- `/admin` 편집기에서 S-C 썸네일을 고르면 미리보기가 원형 판으로 바뀌고 콘솔 오류 없음. 품종 탭에 이름 옵션이 숨는다.
- [ ] 실제 종이(A4 한 장)로 그림 크기·모서리 계절 이름을 본다(사람).
