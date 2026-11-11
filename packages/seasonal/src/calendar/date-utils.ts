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

/** 서울 표준시(UTC+9). 1988년 뒤로 서머타임이 없어 고정이다. */
const SEOUL_OFFSET_MS = 9 * 3_600_000

/**
 * 한 시각(epoch ms)이 드는 서울 날짜. 절기 · 동지 같은 천문 계산 결과를 날짜로 바꿀 때 쓴다.
 * TZDate를 쓰지 않는다. TZDate는 생성자에서 인자 없는 new Date()를 먼저 불러, Next 프리렌더가 "현재 시각을 읽었다"며 빌드를 멈춘다.
 */
export function seoulDateOf(ms: number): CalendarDate {
  const date = new Date(Math.floor(ms) + SEOUL_OFFSET_MS)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}
