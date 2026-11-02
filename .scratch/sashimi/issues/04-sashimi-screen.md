# 04. 제철 회 화면

Status: ready-for-agent
Type: task (AFK)
Blocked by: 02, 03

## 할 일

- [ ] `apps/web/features/seasonal/sashimi/`: 달 칩(링크), 제목과 "N종", 카드 목록, 안내 문구(spec 3장).
- [ ] 카드는 1i 링크(`routes.seasonal.food(id)`). 그림은 기존 품종 그림 컴포넌트를 쓴다.
- [ ] 모바일 1열 가로 카드, 데스크톱 최대 폭 720 카드 2열. 색은 Oura 토큰만.
- [ ] Server Component 기본. 상호작용이 필요한 곳만 `'use client'`.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과
