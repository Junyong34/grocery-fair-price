# 03 전체 궁합표와 제철 품종 상세에서 재료별 페이지로 연결

Status: ready-for-agent
Blocked by: 02

## 할 일

- 전체 궁합표(`PairingGrid`)의 기준 재료 제목(h2)을 그 재료 페이지 링크로 만든다. 인쇄용(`printable`)과 결과 모달에서는 링크를 두지 않거나 일반 텍스트로 둔다.
- 제철 품종 상세(`features/seasonal/food-detail`)의 품종 id가 기준 재료 id와 같으면 "이유식 궁합 보기" 링크를 둔다. 2026-11-09 기준 해당 품종은 감자·고구마·당근·애호박·콩·양배추·시금치·단호박·양파·오이·배추·우엉·사과·딸기·블루베리·멸치·새우·조개다. 데이터는 01에서 옮긴 `@workspace/seasonal/data/infant-pairings`에서 읽는다.
- 링크 문구는 `packages/seasonal/src/data/copy.ts`에 둔다.

## 완료 조건

- 전체표 서버 HTML에 31개 재료 페이지 링크가 있다.
- `/seasonal/foods/sweet-potato`에 궁합 링크가 있고, 해당하지 않는 품종에는 없다.
- `next-dev-loop`로 375·1280 폭에서 확인한다. `pnpm typecheck`, `pnpm lint`, `pnpm test`가 통과한다.
