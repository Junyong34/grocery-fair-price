# 판정 payload는 화면 모양(`VarietyDetail`) 그대로 저장한다

판정 배치는 품종마다 `judgment_snapshot.payload`(jsonb)를 쓰고, 웹 화면은 그것을 옮겨 담지 않고 그대로 그린다. 그래서 payload의 모양은 원천 데이터의 모양이 아니라 화면 타입 `VarietyDetail`(`packages/price/src/types.ts`)이다. 웹은 읽을 때 `packages/price`의 zod 스키마로 모양을 검사한다. 2026-10-30에 정했다 (`.scratch/ingest-foundation/issues/11-judgment-batch.md`, `.scratch/price-db-read/spec.md`).

이유:

- payload는 배치가 돌 때마다 처음부터 다시 계산해 새 묶음으로 바꿔 끼우는 값이다. 옛 모양을 읽을 소비자가 없으므로 저장 모양을 화면과 따로 지킬 이유가 없다.
- 변환 층이 없으면 값이 이상할 때 볼 곳이 배치(`packages/price-ingest/src/judgment/build.ts`) 하나다.
- 판정 규칙(`verdictOfPct`)과 타입을 배치와 화면이 같은 패키지에서 가져오므로 둘이 다르게 계산할 수 없다.

## 고려한 대안

- **원천에 가까운 모양(pipeline.md 4-1의 첫 예시)으로 저장하고 웹이 화면 모양으로 바꾼다**: 저장 모양과 화면이 분리되지만, 변환 코드와 테스트가 하나 더 생기고 그 예시에는 화면이 쓰지 않는 필드(`label`, `confidence.level`)가 있었다.

## 결과

- 화면 모양을 바꾸면 배치도 같이 고치고 다시 돌려야 한다. 배치를 다시 돌리기 전에 배포한 웹은 옛 payload를 읽으므로, 읽을 때 zod 검사가 이 어긋남을 잡는다(목록은 그 행을 빼고, 상세는 오류 화면).
- 원천 쪽 사실(관측값, 일별 시세, 평소가)은 payload가 아니라 각자의 표에 남는다. 다른 모양이 필요해지면 그 표에서 다시 만든다.
