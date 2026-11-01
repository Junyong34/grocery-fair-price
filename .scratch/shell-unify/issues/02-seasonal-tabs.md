# 02. 제철달력 탭 한 벌: 이달 · 월별 · 계절 · 명절

Status: ready-for-agent
Type: task (AFK)
Blocked by: 없음

## 목적

제철달력 안의 2차 탭 두 벌을 한 벌로 합친다(spec 2장). 01과 함께 "계절" 하단 칸이 없어진 자리를 메운다.

## 할 일

- [ ] `apps/web/features/seasonal/components/sub-tabs.tsx`: `THIS_MONTH_TABS` · `SEASON_TABS`를 탭 한 벌(이달 · 월별 · 계절 · 명절)로 합친다. "월별 보기"는 "월별"로 줄인다.
- [ ] `seasonal/(this-month)/layout.tsx`와 `(season)/layout.tsx`가 같은 탭 줄을 그리게 한다. 2b 타임라인과 1g 명절 칩의 레이아웃 배치(가로 스크롤 위치 유지)는 그대로 둔다.
- [ ] `HeaderSubTabs`(헤더 안 작은 탭)와 `useFadeUnderHeader`를 지우고, `SeasonalShell`의 `tabs` prop도 지운다. 스크롤 동작은 05에서 정하므로, 이 티켓에서는 탭 줄을 `position: sticky; top: <헤더 높이>`로 헤더 아래에 붙여만 둔다.
- [ ] 명절 탭은 지금처럼 `routes.seasonal.festivals`(proxy가 다가오는 명절로 보냄)로 간다.
- [ ] 375px에서 탭 4개가 한 줄에 들어가는지 본다. 넘치면 가로 스크롤(`scroll-row`)로 받는다.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과
- 375 · 1280에서 2a · 2b · 3a · 1g의 탭 활성 표시가 맞다. 탭을 오갈 때 하단 내비는 제철달력 칸에 머문다. 콘솔 오류 · 하이드레이션 경고가 없다.
