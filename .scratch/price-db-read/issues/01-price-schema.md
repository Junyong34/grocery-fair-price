# 01. `packages/price` zod 스키마

Status: resolved
Type: task (AFK)
Blocked by: -

## 목적

판정 payload는 화면 타입 `VarietyDetail` 그대로 저장된다 (ADR 0004). 웹이 읽을 때 모양을 검사할 스키마를 `packages/price`에 하나 둔다 (spec 1장).

## 할 일

- [x] 테스트부터: `packages/price/src/schema.test.ts`. 정상 payload, 판정 전(`usual: null`, `verdict.kind: "none"`, `pct: null`), `shelf: null`, `priceSpread` 없음, 필수 필드 빠짐 · 타입 틀림은 실패
- [x] `packages/price/src/schema.ts`: `varietySummarySchema`, `varietyDetailSchema`, `searchIndexSchema`. 알 수 없는 키는 버린다(목록이 payload에서 일부 키를 뺀 jsonb를 `VarietySummary`로 읽기 때문)
- [x] 타입과 스키마가 어긋나지 않게 컴파일 검사: `z.infer<typeof varietyDetailSchema>`와 `VarietyDetail`이 서로 대입 가능한지 테스트 파일에서 확인 (`types.ts`의 손으로 쓴 타입과 주석은 그대로 둔다)
- [x] `packages/price/package.json`에 `zod` 의존성 (다른 패키지와 같은 메이저 4)
- [x] 배치 쪽 확인: `packages/price-ingest/test/judgment-build.test.ts`의 `buildJudgment` 결과가 `varietyDetailSchema`를 통과하는 단언 하나를 더한다

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint`(0 errors) · `pnpm test` 통과.

## Answer

- `packages/price/src/schema.ts`: `varietySummarySchema`, `varietyDetailSchema`(summary를 `extend`), `searchIndexSchema`. zod 객체 기본 동작으로 알 수 없는 키를 버린다. 배열은 `.readonly()`라서 `z.infer`가 `types.ts`의 `readonly` 배열과 양방향으로 대입된다.
- `packages/price/src/schema.test.ts`: 정상 · 판정 전 · `shelf: null` · `priceSpread` 있음/없음, 필수 필드 빠짐 · 타입 틀림 실패, 알 수 없는 키 버림, 무거운 키를 뺀 payload를 목록 행으로 읽기, 검색 별칭. `expectTypeOf(...).toExtend`로 세 쌍의 타입을 양방향 컴파일 검사한다(스키마를 일부러 틀리면 `tsc`가 실패하는 것을 확인).
- `packages/price/package.json`: `zod` `^4.6.5`(seasonal · ui와 같음. price-ingest는 `4.4.3` 고정이지만 스키마 객체의 메서드만 쓰므로 섞여도 문제없다).
- `packages/price-ingest/test/judgment-build.test.ts`: 기본 · 판정 전 · 판매가 있음 · 규격 없음+쌀(`priceSpread`) 네 경우의 `buildJudgment` payload가 `varietyDetailSchema.parse`를 통과하고 값이 그대로인지 단언한다.
- 루트 `pnpm typecheck` · `pnpm lint`(0 errors) · `pnpm test` 통과.
