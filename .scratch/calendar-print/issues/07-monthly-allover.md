# 07. 월간 M-E 그림이 판 전체, 달력은 작은 블록

Status: resolved
Blocked by: 01
구성: `monthly` · `allover` (M-E)

## 목적

월간에 `layout: "allover"`를 더한다. 품종 그림을 시트 전체에 깔고, 달력은 세로 용지에서 모서리 블록, 가로 용지에서 가장자리 날짜 한 열로 줄인다.

## 할 일

- [x] 흩뿌림(`parts/food-area.tsx`, `@workspace/seasonal` 레이아웃)에 피할 영역(avoid 사각형)을 더한다. 레이아웃 함수는 테스트 먼저: 피할 영역과 겹치는 그림이 없어야 한다.
- [x] 작은 달력 블록과 날짜 한 열 부품. 날짜가 작아지는 것이 이 안의 약점이므로 A4 실제 인쇄로 읽히는지 본다.
- [x] 숨길 옵션: `memo`, 달력 `variant`(작은 블록에 맞지 않으면).

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/monthly.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: M-E를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽 (세로·가로)을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-23 완료.

- 피할 영역: `ScatterFrame.avoid`(px 사각형 목록). 시드 후보(`findOpenSpot`)는 영역과의 거리도 틈으로 쳐서 멀리 고르고, Lloyd(`lloydRelax`의 `avoid`)는 그 칸을 어느 원에도 넣지 않으며, 마지막 밀어내기(`relaxShapes`의 `obstacles`)가 그림+이름표 상자를 판 안에 남는 가장 짧은 쪽으로 밀어낸다. 테스트: 실제 품종 1·4·8·11월 × 8·14·20개에서 겹침 0, 피할 영역이 있어도 그림끼리 겹치지 않음. 그림 크기는 피할 영역을 뺀 넓이로 정한다.
- 세로: 판 전체 흩뿌림 + 오른쪽 아래 100×88mm 블록(흰 바탕, 가는 테두리)에 `PrintCalendar`. 블록과 그 왼쪽·위 6mm를 `avoid`로 비운다. 날짜 4.6mm(약 13pt). 에디토리얼·크게·글자 크게를 겹치면 6주짜리 달(5·10월)이 블록을 넘쳐, 줄 높이에 맞춘 상한(`blockDayFont`)을 두었다.
- 가로: 왼쪽 그림, 오른쪽 34mm 날짜 한 열(`parts/day-column.tsx`). 31일 기준 줄 6mm, 날짜 3.8mm(약 10.8pt), 요일 7.5pt, 공휴일 이름 6.5pt. 처음 3.4mm(요일 6pt)로 했다가 작아 키웠다. 긴 대체공휴일 이름은 영어 요일·크게일 때 말줄임이 된다.
- 숨김: `memo`(두 방향), 가로에서 `calendar.variant`·`calendar.weekStart`(날짜 열에는 주 모양이 없다). 세로는 달력 모양 네 가지를 모두 쓴다. `foods.max`는 남겼다(최대 20).
- 확인: A4 세로·가로, A3 세로 열두 달을 스크립트로 잼. 블록과 겹친 그림 0, 블록 넘침 0, 날짜 줄 넘침 0. 10월 우럭 하나가 기울기 때문에 여백 안쪽으로 약 2mm 나온다(흩뿌림 공통, 안전 여백 12mm 안). 편집기에서 구성을 고르면 미리보기가 블록 12장으로, 가로로 바꾸면 날짜 열 12장으로 바뀌고 옵션이 숨음, 콘솔 오류 없음. 실제 종이 인쇄는 하지 않았다(글자 크기는 pt로 셈).

