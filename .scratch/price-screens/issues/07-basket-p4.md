# 07. P4 담은 품종 + 담기 스토어 + 토스트

Status: resolved
Type: task (AFK)
Blocked by: 04, 05, 06

## 할 일

- [x] `features/price/stores/basket-store.ts`: zustand `persist`, `skipHydration: true`, 키 `price:basket`. 품종 id → 담을 때 판정 · 날짜. 마운트 뒤 rehydrate
- [x] P1 · P2 행의 +, P3 앱 바의 담기 / 담음을 스토어에 잇는다. 담기 토스트 "배추를 담았어요 · 목록 보기" (키보드 위에 뜬다)
- [x] 하단 내비 담은 품종 칸에 개수 배지 (0이면 숨김)
- [x] `/basket` (noindex): 앱 바 "담은 품종 N" · 편집, 판정별 한 줄 집계(판정 전 0이면 숨김), "담은 뒤 판정이 바뀐 품종" 알림과 행 아래 "10/16에 담을 때 보통 → 지금 싸요", 열 제목, 판정별 묶음(싸요 → 보통 → 비싸요 → 판정 전, 안은 % 오름차순), ×로 빼기, "+ 품종 더 담기", 빈 목록
- [x] 묶음 · 집계 · 바뀐 판정 계산은 순수 함수로 테스트 먼저

## 완료 기준

- 375 · 1280에서 담기 → 토스트 → 목록 → 빼기 → 빈 목록이 이어지고 콘솔 오류 · 하이드레이션 경고 없음. 루트 검사 통과.

## Answer

2026-10-27. `app/(price)/basket/page.tsx`(noindex), `features/price/basket/basket-view.tsx`, `components/basket-toast.tsx` · `basket-badge.tsx`, 순수 계산 `@workspace/price/basket`(`basketView`).

- store는 04에서 먼저 만들었다(`price:basket`). 담을 때 판정과 그 판정의 **조사일**을 남긴다. 시계(new Date)를 쓰지 않아 "10/16에 담을 때 보통 → 지금 싸요"의 날짜는 판정 기준일이다.
- 토스트: share 버튼과 같은 overlay-kit + cojeev Toast. 새로 담으면 앞 토스트를 닫는다. `visualViewport`로 화면 키보드가 가린 높이를 재서 키보드가 떠 있으면 그 위에 띄운다. 헤드리스 브라우저에는 화면 키보드가 없어 실기기 확인은 남았다.
- 배지: `PriceShell`이 `badges={{ basket: <BasketBadge /> }}`를 셸에 넣는다. 0이면 숨긴다. 데스크톱은 헤더 메뉴 옆.
- "편집"을 누를 때만 행마다 × 빼기와 "모두 빼기"가 나온다(2026-10-27 사용자 요청, 처음에는 ×가 늘 보였다). 편집 중이 아니면 동작 열은 비워 두어 다른 목록과 열 폭이 같다.
- 목록은 기기 값을 불러오기 전에는 그리지 않는다(빈 목록 화면이 잠깐 비치지 않게).
- 확인: 375 · 1280에서 검색 → + 담기 → 토스트 → "목록 보기" → P4(집계 싸요 1 · 보통 2 · 비싸요 1 · 판정 전 1, 고등어 바뀐 판정) → × → 빈 목록, 내비 배지 5 → 숨김. 콘솔 오류 · 하이드레이션 경고 없음.
