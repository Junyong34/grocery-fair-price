import { HOLIDAY_YEARS } from "./holidays"
import type { CalendarDate } from "./month-calendar"
import { clampYear, formatYearMonth } from "./year-month"

/** 서비스를 연 해. 이보다 앞선 2a는 만들지 않는다. */
const FIRST_YEAR = 2026

/**
 * 2a를 미리 그리는 해. 서비스 첫해부터 공휴일 데이터가 있는 마지막 해까지다.
 * 공휴일 패키지(@hyunbinseo/holidays-kr)를 올려 새 해가 생기면 함께 늘어난다. 범위 밖의 해는 런타임에 그리지 않는다
 * (런타임 프리렌더에서 셸의 usePathname()이 막힌다, .scratch/seasonal-static/spec.md 5.1).
 */
export const STATIC_YEARS: readonly number[] = HOLIDAY_YEARS.filter((year) => year >= FIRST_YEAR)

/** proxy.ts가 /seasonal을 보낼 (연, 월) 키. 범위를 넘은 해는 마지막 해로 붙인다. */
export function staticYearMonth(today: CalendarDate): string {
  return formatYearMonth(clampYear(today.year, STATIC_YEARS), today.month)
}
