# 01 궁합 데이터를 도메인 레이어로 옮기고 역참조·색인 함수 더하기

Status: resolved (2026-11-09)

스펙: `../spec.md` "라우팅·레이어"

## 할 일

- `apps/web/features/baby-food/data.ts`의 `PAIRINGS`·`PairingRow`·`IngredientCategory`·`PAIRING_CATEGORIES`·`PAIRING_SHEETS`를 `packages/seasonal/src/data/infant-pairings.ts`로 옮긴다. `PAIRING_ART`·`PAIRING_REFERENCES`는 앱에 남긴다. 앱의 import를 모두 새 경로로 바꾼다.
- `PairingRow`에 `id`를 더한다. 값은 `PAIRING_ART` 경로의 폴더 이름과 같다(`beef`, `sweet-potato` …). `브로콜리/콜리플라워`는 `broccoli`로 한다.
- 먼저 `infant-pairings.test.ts`를 쓴다.
  - id가 모두 다르고, `[a-z0-9-]+` 형식이다.
  - `pairingMentions("소고기")`: 다른 기준 재료의 표에서 소고기가 나온 곳을 `{ base, sign: "O" | "X" }[]`로 돌려준다. 예: 고구마 표의 X.
  - `pairingRelationCount(row)` = O 개수 + X 개수 + 역참조 수.
  - `isPairingIndexable(row, { hasCopy })`: 관계 수가 5 이상이거나 `hasCopy`이면 true. 배추·우엉·블루베리·조개·연어·콩은 false, 소고기·고구마는 true.
- 위 함수들을 구현한다.

## 완료 조건

- 화면 변화가 없다. 기존 `/baby-food`, `/baby-food/result`, `/baby-food/pairings`, `/admin/baby-food/print`가 그대로 나온다.
- 루트에서 `pnpm typecheck`, `pnpm lint`, `pnpm test`가 통과한다.
