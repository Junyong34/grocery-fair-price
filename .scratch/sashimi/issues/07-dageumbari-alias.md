# 07. 자바리 별칭 "다금바리"

Status: ready-for-human
Type: task (prototypes/가 있는 기기에서)
Blocked by: 없음

## 목적

제주와 횟집에서 자바리를 "다금바리"로 부른다. 검색창에 "다금바리"를 치면 자바리(`longtooth-grouper`)가 나오게 한다. 표준명 다금바리는 다른 종이라 이름은 바꾸지 않고 별칭만 더한다. 붉바리는 다금바리로 부르지 않는다.

## 할 일

- [ ] `prototypes/seasonal-food/docs/seasonal-lists/foods.json`의 자바리 항목 `keys`에 `"다금바리"`를 더한다. `name`은 고치지 않는다(id 대응이 바뀔 수 있다).
- [ ] `pnpm --filter @workspace/seasonal build:foods`
- [ ] `git diff packages/seasonal/src/data/foods.generated.ts`: 자바리 줄의 `aliases: ["다금바리"]` 한 줄만 바뀌었는지 본다. 다른 줄이 바뀌면(제철 보정 5종 포함) 멈추고 원인을 본다.
- [ ] 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test`
- [ ] 커밋: `feat: 자바리 검색 별칭에 다금바리를 더함`
