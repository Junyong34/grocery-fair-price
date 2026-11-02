# 01. 달별 회 품종 데이터

Status: resolved
Type: task (AFK)
Blocked by: 없음

## 목적

제철 회 화면의 달별 품종 목록을 순수 TS로 만든다(spec 4장).

## 할 일

- [x] `packages/seasonal/src/data/sashimi.test.ts`를 먼저 쓴다: 모든 id가 `FOODS`에 있다, 1~12월 모두 1개 이상, 한 달 안 중복 없음, 친숙도 1→3 다음 첨부 순서, 전체 고유 품종 55개.
- [x] `sashimi.ts`: 첨부 48종(`apps/web/docs/seafood-content/reference.json`의 `monthlyContent`, 이름을 앱 id로 옮김) + 추가 7종(대표 달). 원천 JSON을 런타임에 읽지 않고 id 목록을 코드로 적는다.
- [x] 내보내기: `sashimiInMonth(month): Food[]`.

## 완료 기준

- `pnpm --filter @workspace/seasonal test` 통과

## Answer

2026-11-03. `packages/seasonal/src/data/sashimi.ts`가 `SASHIMI_MONTHS`(달 → 품종 id, `Record<Month, readonly FoodId[]>`라 오타는 typecheck에서 걸린다), `ADDED_SASHIMI`(추가 7종), `sashimiInMonth(month)`를 내보낸다. 첨부 이름은 "광어(넙치)" → `olive-flounder`처럼 괄호를 떼거나 별칭으로 옮겼다. 테스트 7개(`sashimi.test.ts`): 수산 품종 id, 달마다 1종 이상·중복 없음, 고유 55종, 추가 품종은 대표 달에만, 친숙도 순서, 같은 등급은 적은 순서(2월: 광어 → 대구 → 학꽁치 → 가숭어 → 동해한치), 1~12 밖은 빈 목록.
