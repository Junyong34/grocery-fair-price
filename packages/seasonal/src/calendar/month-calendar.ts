import { daysInMonth as daysIn, weekdayOf } from "./date-utils"
import type { MonthHolidays } from "./holidays"

/** 달력의 날짜 하나. weekday는 일요일이 0이다. */
export type CalendarDay = {
  day: number
  weekday: number
  /** 그날의 공휴일 이름(대체공휴일 포함). 없으면 빈 목록이다. */
  holidays: readonly string[]
  isToday: boolean
}

/** 앞뒤 빈칸은 null이다. */
export type CalendarCell = CalendarDay | null

export type CalendarDate = { year: number; month: number; day: number }

/**
 * 한 달을 일~토 7칸짜리 주로 나눈다. 첫 주 앞과 마지막 주 뒤는 빈칸으로 채운다.
 * today는 서울 기준 오늘이다(calendar/today). 순수 함수로 두려고 밖에서 받는다.
 * holidays는 그 달 공휴일(calendar/holidays)이다. 공휴일 데이터가 클라이언트 번들에 들지 않도록 밖에서 받는다.
 */
export function monthCalendar({
  year,
  month,
  today,
  holidays,
}: {
  year: number
  month: number
  today: CalendarDate
  holidays: MonthHolidays
}): CalendarCell[][] {
  const firstWeekday = weekdayOf({ year, month, day: 1 })
  const daysInMonth = daysIn(year, month)

  const cells: CalendarCell[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      weekday: (firstWeekday + day - 1) % 7,
      holidays: holidays[day] ?? [],
      isToday: today.year === year && today.month === month && today.day === day,
    })
  }
  while (cells.length % 7) cells.push(null)

  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7))
}
