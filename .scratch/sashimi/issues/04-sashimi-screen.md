# 04. 제철 회 화면

Status: resolved
Type: task (AFK)
Blocked by: 02, 03

## 할 일

- [x] `apps/web/features/seasonal/sashimi/`: 달 칩(링크), 제목과 "N종", 카드 목록, 안내 문구(spec 3장).
- [x] 카드는 1i 링크(`routes.seasonal.food(id)`). 그림은 기존 품종 그림 컴포넌트를 쓴다.
- [x] 모바일 1열 가로 카드, 데스크톱 최대 폭 720 카드 2열. 색은 Oura 토큰만.
- [x] Server Component 기본. 상호작용이 필요한 곳만 `'use client'`.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과

## Answer

2026-11-03. `features/seasonal/sashimi/`: `sashimi-month-chips`(클라이언트, 레이아웃에 있어 가로 스크롤 위치 유지, 모바일 가로 스크롤 · 데스크톱 12칸 격자), `sashimi-view`(서버, 제목 · 달 제목 · "N종" · 카드 · 안내). 레이아웃 `app/seasonal/(season)/sashimi/layout.tsx`. 카드는 1i 링크(`scroll={false}`)이고 그림은 `FoodImage`, 앞 두 장만 preload. 색은 Oura 토큰(gold-soft · gold-wash · hairline · stone · caption).

브라우저: 375에서 탭 5개가 한 줄에 들어간다(탭 이름 "제철 회" 유지). 1280에서 처음에는 달 칩 12월이 잘려 데스크톱을 12칸 격자로 바꿨다. 카드를 누르면 오른쪽 1i 패널이 열린다. 콘솔 오류 없음.
