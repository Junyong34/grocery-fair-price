# 10. 막대표 부품 + 월별 포스터 P-B 품종×달 막대표

Status: resolved
Blocked by: 01
구성: `month-poster` · `chart` (P-B)

## 목적

새 부품 **제철 막대표**(행 = 품종, 열 = 1~12월, 제철 달을 막대로)를 만들고, 월별 포스터에 `layout: "chart"`로 쓴다. 이 부품은 Y-C(11), C-3(12)도 쓴다.

## 할 일

- [x] 인터페이스를 먼저 정한다(`mattpocock-skills:codebase-design`). 경계: 행 배치·막대 위치 계산은 `packages/seasonal`의 순수 함수(테스트 먼저), 그리기는 `apps/web/features/print/parts/`. `wireframe-shapes.ts`의 막대표 도형과 계산을 나눠 쓸 수 있는지 본다(와이어프레임은 어드민 기능이므로 인쇄 부품이 어드민을 import하지 않게 한다. 나눠 쓴다면 아래 층으로 옮긴다).
- [x] 행 순서(카테고리별, 제철 시작 달 순 등)와 그림 아이콘을 행 앞에 둘지 정한다.
- [x] 품종이 많아(67개) A4 한 장에 들어가는지, `foods.max`·`categories`로 줄이는지 정한다. 숨길 옵션: `grid`.
- [ ] **A4 한 장을 실제로 인쇄해 글자 크기를 확인**하고 11·12로 간다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/month-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: P-B를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-23 완료. 실제 종이 인쇄는 하지 않았다(아래 체크 하나 남김). 글자 크기는 브라우저에서 pt로 쟀다.

- 인터페이스(`packages/seasonal/src/print/period-chart.ts`, 테스트 먼저):
  - `seasonRuns(months)`: 제철 달 → 1월부터 이어진 막대. 11~2월은 `[1–2]`, `[11–12]` 둘.
  - `chartFoods(categories)`: 그림 있는 품종(고른 카테고리).
  - `chartLines(foods)`: 카테고리 머리 줄 + 품종 줄. 카테고리 차례는 채소·과일·수산·곡물·견과, 묶음 안은 제철 시작 달(`orderSeasonMonths`) 순, 같으면 이름순.
  - `chartColumns(lines, n)`: n단으로 고르게. 단이 묶음 중간에서 시작하면 머리 줄을 다시 넣고, 머리 줄이 단 끝에 홀로 남지 않게 한다.
  - 그리기 `parts/period-chart.tsx`의 `PeriodChart`(한 단)와 `chartLabelWidth`(여러 단의 이름 칸 폭 맞추기). 11·12는 이 둘을 그대로 쓴다.
- 와이어프레임 `periodChart`는 난수로 가짜 막대를 그리는 도형이라 계산을 나눠 쓰지 않았다(인쇄 부품은 어드민을 import하지 않음). 와이어프레임 P-B는 실제처럼 세로 2단·가로 3단으로 고쳤다.
- 행 앞에 작은 그림(줄 높이의 0.82)을 둔다. 막대 색은 제철 시작 계절색.
- 67개가 A4 한 장에 들어간다: 한 단이면 줄 3.5mm(이름 약 6pt)라 세로 2단·가로 3단으로 나눴다. 줄 약 6.4~6.8mm, 이름 9.1pt. 달 머리는 열 폭이 약 5mm라 한글 "12월" 6.1pt, 영문 5.5pt로 작다. 카테고리를 골라 줄이 24개 이하면 한 단, 줄 높이 상한 9mm.
- 숨김: `grid`, `foods.names`(줄마다 이름을 늘 적음), `foods.max`(그림 있는 품종 전부).
- 확인: A4 세로·가로, A3 세로에서 단 밖 넘침 0, 이름·달 표기 잘림 0. 편집기에서 구성을 고르면 미리보기가 막대표 2단으로 바뀜, 콘솔 오류 없음. 확인용 에디션은 지웠다.
- 남은 것: "A4 한 장 실제 인쇄"는 사람이 해야 한다. 특히 달 머리(5.5~6.1pt)가 읽히는지 본다.

