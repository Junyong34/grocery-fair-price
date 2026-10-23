# 11. 연간 한 장 Y-C 열두 달 달력 + 제철 막대표

Status: resolved
Blocked by: 01, 10
구성: `year-sheet` · `chart` (Y-C)

## 목적

연간 한 장에 `layout: "chart"`를 더한다. 위에 작은 달력 열두 개, 아래에 10의 막대표.

## 할 일

- [x] 10의 막대표 부품을 그대로 쓴다. 이 안에 맞게 부품을 바꿔야 하면 부품 쪽 인터페이스를 고친다.
- [x] 막대표에 넣을 품종 수와 달력 크기의 비율을 정한다. 날짜 7pt 하한을 지킨다.
- [x] 숨길 옵션: `grid`, `monthLabel: "big-number"`.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/year-sheet.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: Y-C를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-23 완료. 실제 종이 인쇄는 하지 않았다(글자 크기는 브라우저에서 pt로 쟀다).

- 10의 막대표 부품을 쓴다. 단 나누기·줄 높이·이름 칸 폭 계산을 `PeriodChartColumns`(`parts/period-chart.tsx`) 하나로 모아 P-B·Y-C·C-3이 같이 쓴다. `PeriodChart`(한 단)·`chartLabelWidth`는 파일 밖으로 내보내지 않는다.
- 비율: 달력 세로 4×3·가로 6×2(칸 높이 36·35mm, 폭 약 44mm), 막대표 세로 2단·가로 3단. 막대표 품종은 달마다 대표 넷(`yearFoods`, 48개). 67개 전부면 세로 이름이 약 6pt라 줄였다.
- A4 세로: 날짜 7.5pt, 이름 7.6pt, 달 머리 6.4pt. 가로: 날짜 7.2pt, 이름 7.4pt. A3 세로: 날짜 10.6pt, 이름 10.7pt. 달력 글자 크게 + 글자 크게 + 영문: 날짜 9pt, 넘침 없음. 모두 시트 밖 넘침 0, 이름·달 머리 잘림 0.
- 숨김: `grid`, `foods.max`, `foods.names`(늘 적음). `monthLabel: "big-number"`는 그림 칸이 없어 숫자로 그리고, 선택지에서 뺀다. 이를 위해 선택지마다 `when`을 둘 수 있게 했다(`Option.when`, `shownField`). Y-B도 같이 빠진다.
- 편집기에서 Y-C 썸네일을 고르면 미리보기가 바뀌고 품종 탭이 사라진다. 콘솔 오류 없음. 확인용 에디션은 지웠다.
- 남은 것: A4 한 장 실제 인쇄로 7pt 날짜·막대표 이름이 읽히는지 사람이 본다.
