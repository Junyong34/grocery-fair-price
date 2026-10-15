import * as holidaysByYear from "@hyunbinseo/holidays-kr/all"

import { daysInMonth as daysIn, weekdayOf } from "./date-utils"

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
 */
export function monthCalendar({ year, month, today }: { year: number; month: number; today: CalendarDate }): CalendarCell[][] {
  const firstWeekday = weekdayOf({ year, month, day: 1 })
  const daysInMonth = daysIn(year, month)

  const cells: CalendarCell[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      weekday: (firstWeekday + day - 1) % 7,
      holidays: holidayNames(year, month, day),
      isToday: today.year === year && today.month === month && today.day === day,
    })
  }
  while (cells.length % 7) cells.push(null)

  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7))
}

const HOLIDAYS: Record<string, readonly string[]> = Object.assign({}, ...Object.values(holidaysByYear))

/** 공휴일 데이터는 @hyunbinseo/holidays-kr(관보 기준)에서 온다. 데이터가 없는 연도는 공휴일이 없는 것으로 본다. */
function holidayNames(year: number, month: number, day: number): readonly string[] {
  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  return HOLIDAYS[key] ?? []
}
