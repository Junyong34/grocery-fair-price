/**
 * 달력 모양. 비교 페이지 calendar-styles는 2026-10-16에 지웠다(`git show 22520eb:apps/web/app/examples/calendar-styles/page.tsx`). 화면(2a)은 plain을 쓰고, 넷 모두 PDF 인쇄물의 모양 선택지다.
 * - plain: 선 없이 숫자만, 공휴일 이름을 숫자 아래에
 * - grid: 칸마다 가는 선, 숫자는 칸 왼쪽 위, 공휴일 이름을 칸 안에
 * - editorial: 큰 가는 숫자, 주 사이 가로줄만, 오늘은 먹색 원
 * - tiles: 날마다 둥근 타일, 빨간 날은 옅은 빨강 타일
 */
export const CALENDAR_VARIANTS = ["plain", "grid", "editorial", "tiles"] as const
export type CalendarVariant = (typeof CALENDAR_VARIANTS)[number]

/** ⚙ 설정과 어드민에 보이는 달력 모양 이름 */
export const CALENDAR_VARIANT_LABELS: Record<CalendarVariant, string> = {
  plain: "기본",
  grid: "격자",
  editorial: "큰 숫자",
  tiles: "타일",
}
