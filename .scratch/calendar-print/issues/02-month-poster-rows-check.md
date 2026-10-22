# 02. 월별 포스터 P-D 한 줄에 한 달, 장보기 체크

Status: resolved
Blocked by: 01
구성: `month-poster` · `rows-check` (P-D)

## 목적

월별 포스터에 `layout: "rows-check"`를 더한다. 달마다 한 줄: 큰 숫자, 그림 다섯 개, 이름과 체크 칸. 세로 용지만 쓴다.

## 할 일

- [x] `layout`에 `rows-check`. 가로 용지면 어떻게 할지 정한다(와이어프레임은 세로만. 파서가 거르거나 세로로 그린다).
- [x] 그림 다섯 개를 넘는 품종은 이름 목록에만 넣는다. 체크 칸은 빈 네모로 인쇄한다(`memo: "eaten-check"`와 같은 생각).
- [x] 숨길 옵션: `grid`.
- [x] 기존 부품(`parts/food-area.tsx`의 줄 맞춤, 이름 목록)으로 만든다. 새 부품이 필요하면 이 화면 파일 안에 둔다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/month-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: P-D를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-22 완료.

- 가로 용지: 파서가 거른다(`refine`, 줄 높이가 약 14mm라 목록 글자가 6pt 아래로 내려감).
- 그림은 한 줄 최대 6개(`PICTURES_PER_ROW`). `foods.max`가 더 크면 6에서 자른다(8이면 두 줄로 접혀 그림이 작아졌다). 편집기의 "칸마다 최대 개수"는 그대로 보이지만 6을 넘으면 효과가 없다.
- 체크 목록은 `monthChecklist`(`packages/seasonal/src/print/foods.ts`): 그 달 품종 전체(그림 없는 것 포함), 카테고리 필터, 차례는 `monthFoods`와 같다. 4열, 글자는 가장 많은 달 기준(A4 7.1pt), 줄 높이 1.35.
- 체크 칸 목록을 `features/print/parts/check-list.tsx`로 뺐고, 월간 `memo: "eaten-check"`도 이것을 쓴다(모양 그대로).
- 숨김: `grid`, `foods.names`.
- 확인: A4 세로 한 장, 열두 줄 모두 그림 한 줄, 목록 넘침 0(스크립트로 잼). 편집기에서 구성을 바꾸면 달 배열·이름이 숨고 콘솔 오류 없음. A3는 보지 않았다.
