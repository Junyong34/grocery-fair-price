# 07. 자바리 별칭 "다금바리"

Status: resolved
Type: task
Blocked by: 없음

## 목적

제주와 횟집에서 자바리를 "다금바리"로 부른다. 검색창에 "다금바리"를 치면 자바리(`longtooth-grouper`)가 나오게 한다. 표준명 다금바리는 다른 종이라 이름은 바꾸지 않고 별칭만 더한다. 붉바리는 다금바리로 부르지 않는다.

## 할 일

- [x] 품종 원본 `packages/seasonal/src/data/food-registry.json`의 `longtooth-grouper` 항목 `aliases`에 `"다금바리"`를 더한다. `name`은 고치지 않는다. (2026-11-12: 품종 원본이 `prototypes/`의 `foods.json`에서 이 파일로 옮겨져 `prototypes/` 없이 할 수 있다.)
- [x] `pnpm --filter @workspace/seasonal build:foods`
- [x] `git diff packages/seasonal/src/data/foods.generated.ts`: 자바리 줄의 `aliases: ["다금바리"]` 한 줄만 바뀌었는지 본다. 다른 줄이 바뀌면 멈추고 원인을 본다.
- [x] 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test`
- [x] 커밋: `feat: 자바리 검색 별칭에 다금바리를 더함`

## Comments

2026-11-12: 품종 편집 어드민(`/admin/foods/varieties`)에서 자바리의 별칭에 "다금바리"를 더하고 웹에 반영했다. 품종 원본 diff는 `longtooth-grouper`의 `aliases`뿐이고, `foods.generated.ts`도 자바리 한 줄만 바뀌었다. `/seasonal` 검색에서 "다금바리"로 자바리가 나온다.
