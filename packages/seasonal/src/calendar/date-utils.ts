import type { CalendarDate } from "./month-calendar"

/** 일요일이 0인 요일 이름. */
export const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const

/** 양력 날짜의 요일(일요일 0). 시간대와 무관하게 달력 날짜만으로 계산한다. */
export function weekdayOf({ year, month, day }: CalendarDate): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** 그 달의 날수(윤년 반영). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}
