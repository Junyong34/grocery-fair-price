# 11. 2a 첫 HTML은 이번 달 · 다음 달만, 나머지 달은 늦게 그림

Status: resolved (2026-11-11, 운영 확인은 13)
Type: task (AFK)
Blocked by: 10

## 목적

2a는 12개월을 한 번에 그려 DOM 8,279개, Style & Layout 1.3초, 마크업 0.8MB다. 첫 HTML을 줄이고 다른 달은 화면 가까이 올 때 브라우저에서 그린다(spec 6.3, Q12 · Q16~18).

## 할 일

- [ ] 달 섹션 하나(제목 · 판 · 달력 · 더 보기 · 일별 카드)를 서버와 브라우저 양쪽에서 그릴 수 있는 컴포넌트로 정리한다. `ScatterField`의 배치 계산(`scatterLayout`)은 순수 함수라 그대로 쓴다
- [ ] 달 데이터(품종 · 대표 품종 · 메모 · 공휴일)를 달별 `import()` 청크로 받는다. `year-end-summary.tsx`가 이미 품종 데이터를 client에 싣고 있으니 중복이 생기지 않게 본다
- [ ] `ThisMonthView`: 히어로 · 이번 달 · 다음 달(12월이면 12월만) · YearEnd만 서버에서 그린다. 나머지는 `id` · `data-month` · 예상 높이만 가진 빈 섹션
- [ ] 빈 섹션은 IntersectionObserver(약 1화면 rootMargin)로 그 달을 그린다. 붙여넣은 안처럼 서버 컴포넌트를 `children`으로 넘기지 않는다(RSC에 그대로 실린다)
- [ ] 바로 이동: `MonthRail` · `DesktopMonthPanel` 휠 · `JumpButton` · `#month-N` 해시가 안 그린 달을 가리키면 먼저 그리고 스크롤한다. `active-month.ts` · `MonthScrollSpy`가 빈 섹션에서도 맞게 움직이는지 본다
- [ ] 위쪽 달이 늦게 채워질 때 화면이 튀지 않는지(스크롤 앵커링) 375 · 1280에서 본다

## 완료 기준

- 2a 첫 HTML의 DOM ≤ 2,500, HTML 압축 전 ≤ 1MB(로컬 프로덕션 응답)
- 늦게 그린 달이 서버에서 그린 달과 같아 보이고, 1i 시트 · 먹음 표시 · 모바일 달력 배율이 동작한다. 오늘 표시(10) 유지
- `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과. `/verify`로 2a를 375 · 1280에서 스크롤 · 레일 · 해시 진입까지 확인, 콘솔 오류 · 하이드레이션 경고 없음
