# 01 도메인 데이터 스키마 및 순수 함수 TDD

Type: task
Status: resolved
Blocked by:

## 무엇을

`packages/seasonal/src/data/infant-fruits.ts`를 신설하여 6단계 월령, 과일 메타데이터, 주의 식재료 데이터를 순수 TypeScript로 작성한다.
`packages/seasonal/src/data/infant-fruits.test.ts`를 먼저 작성(TDD)하여 도메인 규칙을 검증한다.

## 작업 상세

1. **타입 정의**:
   - `BabyFruitStageId`: `"4-5-months" | "6-months" | "7-8-months" | "9-11-months" | "12-23-months" | "24-months"`
   - `FruitSafetyStatus`: `"safe" | "conventional" | "caution"`
   - `BabyFruit`: id, name, stages, safetyStatus, prepMethod, chokingRisk, allergyNote, seasonalFoodId, isImported
   - `ProhibitedFood`: id, name, targetStage, severity("forbidden" | "caution"), hazardType, reason, guide
2. **데이터 구축**:
   - 6단계별 과일 21종 매핑 (사과, 배, 바나나, 아보카도, 수박, 참외, 포도, 딸기, 키위, 복숭아, 망고 등)
   - 주의/금기 식재료 8종 (돌 전: 꿀, 생우유, 주스, 날것 / 두 돌 전: 통견과류, 첨가당, 나트륨, 젤리)
3. **순수 함수 및 테스트**:
   - `getFruitsByStage(stageId)`
   - `getProhibitedFoodsForStage(stageId)`
   - `findBabyFruit(id)`
   - `isStageValid(slug)`
   - `isBabyFruitSeasonal(fruit, month)`
   - `getSeasonalFruitsForStage(stageId, month)`
   - Vitest 단위 테스트 11개 100% 통과.

## Answer

- `packages/seasonal/src/data/infant-fruits.ts` 신설 완료: 6단계 월령, 21종 과일 상세 데이터, 8종 주의 식재료 메타데이터 정의.
- `packages/seasonal/src/data/infant-fruits.test.ts` 작성 완료: 11개 단위 테스트 전체 통과.
- `pnpm --filter @workspace/seasonal typecheck` 및 `lint` 0 에러 확인.
