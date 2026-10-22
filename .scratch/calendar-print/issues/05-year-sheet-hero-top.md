# 05. 연간 한 장 Y-B 큰 그림 위, 열두 달 아래

Status: resolved
Blocked by: 01
구성: `year-sheet` · `hero-top` (Y-B)

## 목적

연간 한 장에 `layout: "hero-top"`을 더한다. 위쪽에 그 해 품종 그림을 크게 흩뿌리고, 아래에 작은 달력 열두 개를 놓는다.

## 할 일

- [x] `layout`에 `hero-top`.
- [x] 위 그림에 넣을 품종을 고르는 규칙(달마다 몇 개씩, 계절 고르게 등)을 정하고, 순수 함수면 `packages/seasonal/src/print/foods.ts`에 테스트 먼저.
- [x] 아래 달력 배열은 `grid` 값을 쓸지, 고정할지 정한다. 고정이면 `grid`를 숨긴다. `monthLabel: "big-number"`는 숨긴다.
- [x] A4에서 날짜 숫자가 7pt 아래로 내려가지 않는지 본다(spec "종류별 레이아웃 메모").

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/year-sheet.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: Y-B를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-22 완료.

- 세로 용지만(`PORTRAIT_ONLY`). 달력 배열은 3×4 고정: 2×6은 칸이 낮아 날짜가 5pt 아래, 4×3은 3×4보다 작다(7.5pt 대 8.4pt).
- 위 그림: `yearFoods({ max: 1 })`로 달마다 하나, 열둘(새 순수 함수 없음). 달마다 둘(24개)은 작게 흩어져 큰 그림으로 안 보여 하나로 정했다. 그래서 `foods.max`·`grid`를 숨긴다.
- `monthLabel: "big-number"`는 얹을 그림 칸이 없어 달력 위 보통 숫자로 쓴다(필드는 숨기지 않음).
- 짝 체크무늬의 달력 칸(달 이름 + 작은 달력 + 칸 맞춤 날짜 크기)을 `CalendarBlock`으로 빼서 두 구성이 같이 쓴다.
- 확인: A4 날짜 8.4pt, A3 11.8pt, 넘침 0. 와이어프레임 Y-B를 그림 12개·3×4로 맞췄다.
