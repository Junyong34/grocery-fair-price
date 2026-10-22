# 09. 월간 표지 C-2 열두 달 미리보기

Status: ready-for-agent
Blocked by: 01
구성: `monthly` · `cover: "months"` (C-2)

## 목적

월간 표지에 `cover: "months"`를 더한다. 큰 연도 아래에 열두 달을 작은 칸으로 미리 보여 준다(달마다 그림 한두 개).

## 할 일

- [ ] `cover`에 `months`. `pageCount`는 바뀌지 않는다(표지 한 쪽).
- [ ] 달마다 대표 그림 고르는 규칙을 정한다(`foods.ts`, 테스트 먼저). C-1 표지의 "대표 품종"과 같은 함수를 쓸 수 있으면 쓴다.
- [ ] 와이어프레임 `wireframe-catalog.ts`의 C-1·C-2·C-3 `options` 문자열이 실제 `cover` 값과 맞는지 함께 고친다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/monthly.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: C-2를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
