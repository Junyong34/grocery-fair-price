# 01. 기준값 기록

Status: ready-for-agent
Type: task
Blocked by: 없음

## 목적

이관과 동기화 개편(02~04)이 화면에 나가는 결과를 바꾸지 않았는지 비교할 기준을 남긴다.

## 할 일

- [ ] `baseline.md`를 이 명세 폴더에 쓴다. 아래 값을 명령과 함께 적는다.
  - 품종 원본 `foods.json` 항목 수와 `tier`별 수 (2026-11-12 측정: 286, verified 255 · foodnuri 21 · mof 10)
  - `foods.generated.ts`의 품종 수 (255)
  - `prototypes/seasonal-food/foods/` 그림 폴더 수 (321), `build/catalog.json` 항목 수 (321)
  - `apps/web/public/foods/` 그림 폴더 수 (296), `apps/web/public/dishes/` 폴더 수
  - 품종 ID와 그림 ID가 다른 품종 목록(`DRAWN_AS`), `NEW_IDS`, `CANDIDATE_FOOD_IDS`, 보정 파일의 품종 ID 목록
  - 그림 폴더는 있는데 웹에 없는 그림 ID 목록 (321 − 296)
  - 이유식 화면이 쓰는 그림 ID 중 제철 품종이 아닌 것
- [ ] `foods.generated.ts`, `drawn-foods.generated.ts`, `drawn-dishes.generated.ts`, `food-bounds.generated.ts`, 두 `PROVENANCE.md`의 sha256과 `apps/web/public/foods/**/*.svg` 전체의 묶음 해시를 적는다.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`의 현재 결과를 적는다.

## 완료 기준

`baseline.md`의 값을 같은 명령으로 다시 얻을 수 있다. 코드와 데이터는 바꾸지 않는다.
