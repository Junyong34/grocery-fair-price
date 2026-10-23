# 12. 월간 표지 C-3 1년 제철 표

Status: resolved
Blocked by: 01, 10
구성: `monthly` · `cover: "chart"` (C-3)

## 목적

월간 표지에 `cover: "chart"`를 더한다. 큰 연도 아래에 10의 막대표로 1년 제철을 한눈에 보여 준다.

## 할 일

- [x] `cover`에 `chart`.
- [x] 표지 한 쪽에 넣을 품종 수를 정한다(월간의 `foods.max`는 달마다 개수이므로 표지에는 따로 정하거나 고정).

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/monthly.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: C-3를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-23 완료. 실제 종이 인쇄는 하지 않았다.

- 표지 품종 수: 그림 있는 품종 전부(67개)로 고정. 월간에는 카테고리 옵션이 없고, 표지는 1년 전체를 보여 주는 쪽이라 줄이지 않는다. 세로 2단·가로 3단이면 A4 이름이 상한 9.1pt다.
- 머리는 C-2와 같은 `CoverHeader`(왼쪽 "제철 달력", 오른쪽 큰 연도)로 나눠 C-2·C-3이 같이 쓴다.
- A4 세로·가로: 이름 9.1pt, 달 머리 7.7pt(영문 5.6pt). A3 세로: 이름 12.8pt. 넘침 0, 잘림 0. `pageCount`는 표지 포함 13.
- 숨는 옵션 없음(표지 값이라 월간 구성의 옵션은 열두 장에 그대로 쓰인다).
- 편집기에서 C-3 썸네일을 고르면 미리보기 첫 장이 막대표 표지로 바뀐다. 콘솔 오류 없음. 확인용 에디션은 지웠다.
- 남은 것: A4 실제 인쇄 확인.
