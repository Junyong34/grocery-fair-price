import { daysInMonth, weekdayOf } from "@workspace/seasonal/calendar/date-utils"
import { holidaysInMonth } from "@workspace/seasonal/calendar/holidays"

import { WEEKDAYS } from "./print-calendar"
import { t, u } from "./units"

/**
 * 날짜 한 열(월간 M-E 가로). 1일부터 말일까지 한 줄에 하루씩, 날짜·요일·공휴일 이름과 적을 줄을 둔다.
 * 토·일은 늘 빨강이고, 공휴일은 holidays가 hidden이 아닐 때만 빨강, mark-and-name이면 이름까지 적는다. 일요일 위에 굵은 선을 그어 주를 나눈다.
 */
export function DayColumn({
  year,
  month,
  weekday,
  holidays,
  dayFont,
  width,
  height,
}: {
  year: number
  month: number
  weekday: keyof typeof WEEKDAYS
  holidays: "hidden" | "mark" | "mark-and-name"
  /** 날짜 숫자 크기(용지 단위) */
  dayFont: number
  width: number
  height: number
}) {
  const days = daysInMonth(year, month)
  const names = holidays === "hidden" ? {} : holidaysInMonth(year, month)
  const rowHeight = height / days
  return (
    <ol className="print-day-column" style={{ width: u(width), height: u(height) }}>
      {Array.from({ length: days }, (_, i) => {
        const day = i + 1
        const dow = weekdayOf({ year, month, day })
        const holiday = names[day] ?? []
        const red = dow === 0 || dow === 6 || holiday.length > 0
        return (
          <li key={day} className={dow === 0 && day > 1 ? "is-week-start" : undefined} style={{ height: u(rowHeight), gap: u(dayFont * 0.4) }}>
            <span className={`print-number ${red ? "is-red" : ""}`} style={{ width: u(dayFont * 1.25), fontSize: t(dayFont) }}>
              {day}
            </span>
            <span className={red ? "is-red" : "weekday"} style={{ width: u(dayFont * (weekday === "english-short" ? 1.5 : 0.8)), fontSize: t(dayFont * 0.7) }}>
              {WEEKDAYS[weekday][dow]}
            </span>
            {holidays === "mark-and-name" && holiday.length > 0 && (
              <span className="holiday-name" style={{ fontSize: t(dayFont * 0.6) }}>
                {holiday.join(", ")}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
