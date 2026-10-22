# 05. 연간 한 장 Y-B 큰 그림 위, 열두 달 아래

Status: ready-for-agent
Blocked by: 01
구성: `year-sheet` · `hero-top` (Y-B)

## 목적

연간 한 장에 `layout: "hero-top"`을 더한다. 위쪽에 그 해 품종 그림을 크게 흩뿌리고, 아래에 작은 달력 열두 개를 놓는다.

## 할 일

- [ ] `layout`에 `hero-top`.
- [ ] 위 그림에 넣을 품종을 고르는 규칙(달마다 몇 개씩, 계절 고르게 등)을 정하고, 순수 함수면 `packages/seasonal/src/print/foods.ts`에 테스트 먼저.
- [ ] 아래 달력 배열은 `grid` 값을 쓸지, 고정할지 정한다. 고정이면 `grid`를 숨긴다. `monthLabel: "big-number"`는 숨긴다.
- [ ] A4에서 날짜 숫자가 7pt 아래로 내려가지 않는지 본다(spec "종류별 레이아웃 메모").

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/year-sheet.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: Y-B를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
