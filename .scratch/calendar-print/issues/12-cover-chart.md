# 12. 월간 표지 C-3 1년 제철 표

Status: ready-for-agent
Blocked by: 01, 10
구성: `monthly` · `cover: "chart"` (C-3)

## 목적

월간 표지에 `cover: "chart"`를 더한다. 큰 연도 아래에 10의 막대표로 1년 제철을 한눈에 보여 준다.

## 할 일

- [ ] `cover`에 `chart`.
- [ ] 표지 한 쪽에 넣을 품종 수를 정한다(월간의 `foods.max`는 달마다 개수이므로 표지에는 따로 정하거나 고정).

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/monthly.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: C-3를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
