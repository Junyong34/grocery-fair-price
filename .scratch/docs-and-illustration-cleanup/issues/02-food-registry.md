# 02. 품종 원본으로 이관

Status: ready-for-agent
Type: task (prototypes/가 있는 기기에서)
Blocked by: 01 (resolved)

## 목적

품종의 표시명, 별칭, 카테고리, 제철 달, 근거를 저장소 한 곳에서 고치게 한다 (명세 결정 1~5).

## 할 일

- [ ] 항목 형식을 정하고 zod 스키마와 테스트를 먼저 쓴다(`packages/seasonal`). 필드: 표시명, 별칭, 카테고리, 제철 달, 대표 달, 제철 검증 상태, 근거(출처·확인일·사유), 그림 ID(품종 ID와 다를 때만).
- [ ] 한 번 쓰는 이관 스크립트로 `packages/seasonal/src/data/food-registry.json`을 만든다. 입력: `foods.json` 286종, `build/catalog.json`, `DRAWN_AS`, `NEW_IDS`, `food-season-corrections.json`.
  - 품종 ID는 지금 `foods.generated.ts`의 ID를 그대로 쓴다. 미검증 31종은 대응하는 그림 ID가 있으면 그것을, 없으면 새로 정한다.
  - `tier`·`promoted`는 제철 검증 상태와 근거 출처로 나눈다. `core`를 다시 계산할 수 있어야 한다.
  - 보정값은 달에 합치고 `reason`·`sources`·`checkedAt`을 근거에 남긴다. `market` 문구도 근거로 옮긴다.
- [ ] 원본에서 `foods.generated.ts`를 만드는 생성 단계를 쓴다. 제철 검증된 품종만 넣는다.
- [ ] 이관 전후 `foods.generated.ts`를 비교한다. 01의 해시와 같아야 한다. 다르면 차이를 티켓에 적고 의도한 것만 남긴다.
- [ ] 이관이 끝나면 `food-season-corrections.json`과 이관 스크립트를 지우고, `build-foods.mjs`의 `DRAWN_AS`·`NEW_IDS`·`--refresh-seasons`를 없앤다.
- [ ] `.scratch/sashimi/issues/07-dageumbari-alias.md`의 할 일을 새 원본 기준으로 고친다.

## 완료 기준

- `foods.generated.ts`가 01과 같다(또는 차이가 설명돼 있다).
- 품종 ID 255개와 `renamed-foods.ts`가 바뀌지 않았다.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과.
