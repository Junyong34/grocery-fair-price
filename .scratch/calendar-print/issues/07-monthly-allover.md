# 07. 월간 M-E 그림이 판 전체, 달력은 작은 블록

Status: ready-for-agent
Blocked by: 01
구성: `monthly` · `allover` (M-E)

## 목적

월간에 `layout: "allover"`를 더한다. 품종 그림을 시트 전체에 깔고, 달력은 세로 용지에서 모서리 블록, 가로 용지에서 가장자리 날짜 한 열로 줄인다.

## 할 일

- [ ] 흩뿌림(`parts/food-area.tsx`, `@workspace/seasonal` 레이아웃)에 피할 영역(avoid 사각형)을 더한다. 레이아웃 함수는 테스트 먼저: 피할 영역과 겹치는 그림이 없어야 한다.
- [ ] 작은 달력 블록과 날짜 한 열 부품. 날짜가 작아지는 것이 이 안의 약점이므로 A4 실제 인쇄로 읽히는지 본다.
- [ ] 숨길 옵션: `memo`, 달력 `variant`(작은 블록에 맞지 않으면).

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/monthly.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: M-E를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽 (세로·가로)을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
