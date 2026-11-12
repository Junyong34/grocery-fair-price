# 02. 품종 원본으로 이관

Status: resolved
Type: task (prototypes/가 있는 기기에서)
Blocked by: 01 (resolved)

## 목적

품종의 표시명, 별칭, 카테고리, 제철 달, 근거를 저장소 한 곳에서 고치게 한다 (명세 결정 1~5).

## 할 일

- [x] 항목 형식을 정하고 zod 스키마와 테스트를 먼저 쓴다(`packages/seasonal`). 필드: 표시명, 별칭, 카테고리, 제철 달, 대표 달, 제철 검증 상태, 근거(출처·확인일·사유), 그림 ID(품종 ID와 다를 때만).
- [x] 한 번 쓰는 이관 스크립트로 `packages/seasonal/src/data/food-registry.json`을 만든다. 입력: `foods.json` 286종, `build/catalog.json`, `DRAWN_AS`, `NEW_IDS`, `food-season-corrections.json`.
  - 품종 ID는 지금 `foods.generated.ts`의 ID를 그대로 쓴다. 미검증 31종은 대응하는 그림 ID가 있으면 그것을, 없으면 새로 정한다.
  - `tier`·`promoted`는 제철 검증 상태와 근거 출처로 나눈다. `core`를 다시 계산할 수 있어야 한다.
  - 보정값은 달에 합치고 `reason`·`sources`·`checkedAt`을 근거에 남긴다. `market` 문구도 근거로 옮긴다.
- [x] 원본에서 `foods.generated.ts`를 만드는 생성 단계를 쓴다. 제철 검증된 품종만 넣는다.
- [x] 이관 전후 `foods.generated.ts`를 비교한다. 01의 해시와 같아야 한다. 다르면 차이를 티켓에 적고 의도한 것만 남긴다.
- [x] 이관이 끝나면 `food-season-corrections.json`과 이관 스크립트를 지우고, `build-foods.mjs`의 `DRAWN_AS`·`NEW_IDS`·`--refresh-seasons`를 없앤다.
- [x] `.scratch/sashimi/issues/07-dageumbari-alias.md`의 할 일을 새 원본 기준으로 고친다.

## 완료 기준

- `foods.generated.ts`가 01과 같다(또는 차이가 설명돼 있다).
- 품종 ID 255개와 `renamed-foods.ts`가 바뀌지 않았다.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과.

## Comments

2026-11-12: 이관을 마쳤다.

- 품종 원본 `food-registry.json`에 286종(제철 검증 255, 미검증 31)이 있다. 형식과 검사는 `food-registry.ts`, 테스트는 `food-registry.test.ts`.
- `foods.generated.ts`는 머리말 주석 두 줄만 달라졌고 품종 255줄은 01과 같다. 테스트가 원본과 생성 목록이 같은지 본다.
- `basis`로 근거 갈래를 나눴다: `survey`(79, 이전의 `core`), `foodnuri`, `mof`, `user`(사용자가 준 자료). `core`는 `basis === "survey"`로 계산한다.
- 새우류는 그림 `shrimp`가 이미 대하의 품종 ID라 품종 ID를 `shrimp-kinds`로 새로 정하고 `art: "shrimp"`를 적었다. 그림 ID가 품종 ID와 다른 품종은 이것 하나다. 미검증이라 URL이 없어 나중에 바꿔도 된다.
- `build:foods`는 이제 `prototypes/` 없이 돌아간다. `food-season-corrections.json`, `DRAWN_AS`, `NEW_IDS`, `--refresh-seasons`를 없앴다. 이관 스크립트는 저장소에 두지 않았다.

**04·06이 알아야 할 것**: 제철 검증 255종 가운데 근거 출처가 빈 품종이 110종, 확인일이 없는 품종이 248종이다(확인일은 제철 보정 7종에만 있다). 사용자 자료로 올린 33종은 `note`에 "독립 검증 전"이라고 적혀 있는데도 검증 상태다. 옛 자료의 상태를 그대로 옮긴 것이라 이번에 바꾸지 않았다. 그래서 명세 결정 11의 "제철 검증됐는데 근거가 빈 품종" 검사는 기존 품종에 그대로 걸 수 없다. 04는 달이 빈 것만 오류로 보고 근거가 빈 품종은 개수로 알리며, 근거와 확인일 필수는 어드민이 새로 저장하는 품종에만 건다(06·07).
