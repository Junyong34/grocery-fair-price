import { describe, expect, it } from "vitest"

import { holidaysInMonth } from "./holidays"
import { monthCalendar } from "./month-calendar"

const today = { year: 2026, month: 10, day: 13 }

describe("monthCalendar", () => {
  it("2026년 10월은 목요일에 시작해 앞 빈칸 4개, 5주로 채운다", () => {
    const weeks = monthCalendar({ year: 2026, month: 10, today, holidays: holidaysInMonth(2026, 10) })

    expect(weeks).toHaveLength(5)
    expect(weeks[0]!.slice(0, 4)).toEqual([null, null, null, null])
    expect(weeks[0]![4]).toMatchObject({ day: 1, weekday: 4 })
    expect(weeks[4]![6]).toMatchObject({ day: 31, weekday: 6 })
  })

  it("공휴일에는 공휴일 이름이, 평일에는 빈 목록이 붙는다", () => {
    const days = monthCalendar({ year: 2026, month: 10, today, holidays: holidaysInMonth(2026, 10) }).flat()
    const holidaysOn = (day: number) => days.find((cell) => cell?.day === day)!.holidays

    expect(holidaysOn(3)).toEqual(["개천절"])
    expect(holidaysOn(5)).toEqual(["대체공휴일(개천절)"])
    expect(holidaysOn(9)).toEqual(["한글날"])
    expect(holidaysOn(13)).toEqual([])
  })

  it("오늘인 날 하나만 오늘로 표시하고, 다른 달에는 오늘이 없다", () => {
    const october = monthCalendar({ year: 2026, month: 10, today, holidays: holidaysInMonth(2026, 10) }).flat()
    expect(october.filter((cell) => cell?.isToday).map((cell) => cell!.day)).toEqual([13])

    const november = monthCalendar({ year: 2026, month: 11, today, holidays: holidaysInMonth(2026, 11) }).flat()
    expect(november.some((cell) => cell?.isToday)).toBe(false)

    const lastOctober = monthCalendar({ year: 2025, month: 10, today, holidays: holidaysInMonth(2025, 10) }).flat()
    expect(lastOctober.some((cell) => cell?.isToday)).toBe(false)
  })
})
