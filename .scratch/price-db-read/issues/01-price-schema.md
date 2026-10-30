# 01. `packages/price` zod 스키마

Status: ready-for-agent
Type: task (AFK)
Blocked by: -

## 목적

판정 payload는 화면 타입 `VarietyDetail` 그대로 저장된다 (ADR 0004). 웹이 읽을 때 모양을 검사할 스키마를 `packages/price`에 하나 둔다 (spec 1장).

## 할 일

- [ ] 테스트부터: `packages/price/src/schema.test.ts`. 정상 payload, 판정 전(`usual: null`, `verdict.kind: "none"`, `pct: null`), `shelf: null`, `priceSpread` 없음, 필수 필드 빠짐 · 타입 틀림은 실패
- [ ] `packages/price/src/schema.ts`: `varietySummarySchema`, `varietyDetailSchema`, `searchIndexSchema`. 알 수 없는 키는 버린다(목록이 payload에서 일부 키를 뺀 jsonb를 `VarietySummary`로 읽기 때문)
- [ ] 타입과 스키마가 어긋나지 않게 컴파일 검사: `z.infer<typeof varietyDetailSchema>`와 `VarietyDetail`이 서로 대입 가능한지 테스트 파일에서 확인 (`types.ts`의 손으로 쓴 타입과 주석은 그대로 둔다)
- [ ] `packages/price/package.json`에 `zod` 의존성 (다른 패키지와 같은 메이저 4)
- [ ] 배치 쪽 확인: `packages/price-ingest/test/judgment-build.test.ts`의 `buildJudgment` 결과가 `varietyDetailSchema`를 통과하는 단언 하나를 더한다

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint`(0 errors) · `pnpm test` 통과.
