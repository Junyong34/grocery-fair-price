import { holidaysInMonth } from "@workspace/seasonal/calendar/holidays"
import { monthCalendar } from "@workspace/seasonal/calendar/month-calendar"
import type { CalendarVariant } from "@workspace/seasonal/calendar/variants"

import { t, u } from "./units"

export const WEEKDAYS = {
  korean: ["일", "월", "화", "수", "목", "금", "토"],
  "english-short": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  "english-initial": ["S", "M", "T", "W", "T", "F", "S"],
} as const

/** 인쇄에는 오늘 표시가 없다. 어느 날과도 같지 않은 날짜를 넘긴다. */
const NO_TODAY = { year: 0, month: 0, day: 0 }

/**
 * 인쇄용 한 달 달력. 화면 달력(MonthCalendar)과 같은 네 모양이지만 크기를 용지 단위로 쓴다.
 * 토·일은 늘 빨강이고, 공휴일은 holidays가 hidden이 아닐 때만 빨강, mark-and-name이면 이름까지 적는다.
 * renderBlank를 주면 1일 앞·말일 뒤 빈 칸에 그 내용을 넣는다(쓰는 달력의 빈 칸 그림).
 */
export function PrintCalendar({
  year,
  month,
  weekStart,
  weekday,
  holidays,
  variant = "plain",
  dayFont,
  height,
  renderBlank,
}: {
  year: number
  month: number
  weekStart: 0 | 1
  weekday: keyof typeof WEEKDAYS
  holidays: "hidden" | "mark" | "mark-and-name"
  variant?: CalendarVariant
  /** 날짜 숫자 크기(용지 단위). 나머지 글자는 이 값에 비례한다. */
  dayFont: number
  /** 요일 줄까지 포함한 달력 높이(용지 단위). 주 수(4~6)에 맞춰 나눈다. */
  height: number
  /** 빈 칸에 넣을 내용. index는 앞 빈 칸부터 센 차례, rowHeight는 칸 높이(용지 단위)다. */
  renderBlank?: (index: number, rowHeight: number) => React.ReactNode
}) {
  const weeks = monthCalendar({
    year,
    month,
    today: NO_TODAY,
    holidays: holidays === "hidden" ? {} : holidaysInMonth(year, month),
    weekStart,
  })
  const columns = Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7)
  const weekend = (day: number) => day === 0 || day === 6
  const rowHeight = (height - dayFont * 1.3) / weeks.length
  const cellPadding = variant === "grid" || variant === "editorial" ? u(dayFont * 0.25) : 0
  let blank = 0

  return (
    <table className="print-calendar" data-variant={variant}>
      <thead>
        <tr>
          {columns.map((day) => (
            <th key={day} className={weekend(day) ? "is-red" : undefined} style={{ fontSize: t(dayFont * 0.62), paddingBottom: u(dayFont * 0.45), paddingLeft: cellPadding }}>
              {WEEKDAYS[weekday][day]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, w) => (
          <tr key={w}>
            {week.map((cell, d) => {
              const red = !!cell && (weekend(cell.weekday) || cell.holidays.length > 0)
              return (
                <td
                  key={d}
                  className={[cell && "has-day", red && "is-red-cell"].filter(Boolean).join(" ") || undefined}
                  style={{ height: u(rowHeight), padding: cellPadding, paddingTop: u(dayFont * 0.25) }}
                >
                  {!cell && renderBlank?.(blank++, rowHeight)}
                  {cell && (
                    <>
                      <span className={`day print-number ${red ? "is-red" : ""}`} style={{ fontSize: t(variant === "editorial" ? dayFont * 1.4 : dayFont), lineHeight: 1 }}>
                        {cell.day}
                      </span>
                      {holidays === "mark-and-name" && cell.holidays.length > 0 && (
                        <span className="holiday-name" style={{ fontSize: t(dayFont * 0.48), marginTop: u(dayFont * 0.15) }}>
                          {cell.holidays.join(", ")}
                        </span>
                      )}
                    </>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
