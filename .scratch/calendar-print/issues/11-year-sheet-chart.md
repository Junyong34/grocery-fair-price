# 11. 연간 한 장 Y-C 열두 달 달력 + 제철 막대표

Status: ready-for-agent
Blocked by: 01, 10
구성: `year-sheet` · `chart` (Y-C)

## 목적

연간 한 장에 `layout: "chart"`를 더한다. 위에 작은 달력 열두 개, 아래에 10의 막대표.

## 할 일

- [ ] 10의 막대표 부품을 그대로 쓴다. 이 안에 맞게 부품을 바꿔야 하면 부품 쪽 인터페이스를 고친다.
- [ ] 막대표에 넣을 품종 수와 달력 크기의 비율을 정한다. 날짜 7pt 하한을 지킨다.
- [ ] 숨길 옵션: `grid`, `monthLabel: "big-number"`.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/year-sheet.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: Y-C를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
