# 08. FoodImage를 일반 img로

Status: resolved
Type: task (AFK)
Blocked by: 없음

## 목적

`FoodImage`가 `next/image`를 써서 그림마다 client 컴포넌트가 됐다. SVG는 `next/image` 최적화를 받지 못하므로 이득 없이 하이드레이션 비용만 든다(2a 그림 782개). 구현 중 발견해 더한 티켓이다.

## 할 일

- [x] `features/seasonal/components/food-image.tsx`: 일반 `<img>`(`loading="lazy"`, `decoding="async"`). `preload`는 `react-dom`의 `preload()` + `loading="eager"` + `fetchPriority="high"`
- [x] `sizes` prop 삭제, 호출부 15곳에서 지움
- [x] 2a · 1i 시트 · 계절 화면 375 · 1280 확인

## 완료 기준

- `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과
- 2a 그림이 모두 lazy `<img>`이고 깨진 그림이 없다. 1i 시트 그림은 preload된다. 콘솔 오류 · 하이드레이션 경고 없음
