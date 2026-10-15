import { WEEKDAY_NAMES } from "@workspace/seasonal/calendar/date-utils"
import type { MonthHolidays } from "@workspace/seasonal/calendar/holidays"
import { monthCalendar, type CalendarDate, type CalendarDay } from "@workspace/seasonal/calendar/month-calendar"
import { cn } from "@workspace/ui/lib/utils"

import { HolidayName } from "./holiday-name"

/** 토요일(6)·일요일(0) */
const isWeekend = (weekday: number) => weekday === 0 || weekday === 6

/**
 * 달력 모양(/examples/calendar-styles에서 비교). 화면(2a)은 plain을 쓰고, 나머지는 MVP 이후 PDF 달력의 모양 선택지로 둔다.
 * - plain: 선 없이 숫자만, 공휴일 이름을 숫자 아래에
 * - grid: 칸마다 가는 선, 숫자는 칸 왼쪽 위, 공휴일 이름을 칸 안에
 * - editorial: 큰 가는 숫자, 주 사이 가로줄만, 오늘은 먹색 원
 * - tiles: 날마다 둥근 타일, 빨간 날은 옅은 빨강 타일
 */
export const CALENDAR_VARIANTS = ["plain", "grid", "editorial", "tiles"] as const
export type CalendarVariant = (typeof CALENDAR_VARIANTS)[number]

/** ⚙ 설정에 보이는 달력 모양 이름 */
export const CALENDAR_VARIANT_LABELS: Record<CalendarVariant, string> = {
  plain: "기본",
  grid: "격자",
  editorial: "큰 숫자",
  tiles: "타일",
}

/**
 * 한 달 달력(명세 5절, 절기 제외). 토·일·공휴일은 빨간 숫자다.
 * 공휴일 표시 설정(data-holidays=off)을 끄면 공휴일 이름과 빨간 표시가 함께 사라진다. 토·일은 그대로 빨간 날짜다.
 */
export function MonthCalendar({
  year,
  month,
  today,
  holidays,
  variant = "plain",
}: {
  year: number
  month: number
  today: CalendarDate
  /** 그 달 공휴일. 서버에서 holidaysInMonth로 구해 넘긴다. */
  holidays: MonthHolidays
  variant?: CalendarVariant
}) {
  const weeks = monthCalendar({ year, month, today, holidays })
  return (
    <table
      className={cn(
        "w-full table-fixed text-center",
        variant === "tiles" ? "border-separate border-spacing-1" : "border-collapse",
        variant === "grid" && "border border-hairline",
      )}
    >
      <caption className="sr-only">
        {year}년 {month}월 달력
      </caption>
      <thead>
        <tr>
          {WEEKDAY_NAMES.map((weekday, i) => (
            <th
              key={weekday}
              scope="col"
              className={cn(
                "text-[11px] font-normal text-ash",
                variant === "plain" && "pb-2 text-[13px] lg:text-sm",
                variant === "grid" && "border-b border-hairline bg-surface/60 py-1.5",
                variant === "editorial" && "border-b border-ink pb-2 text-left text-xs font-semibold tracking-wide text-ink",
                variant === "tiles" && "pb-0.5",
                isWeekend(i) && "text-holiday",
              )}
            >
              {weekday}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, w) => (
          <tr key={w} className={cn(variant === "editorial" && "border-b border-hairline")}>
            {week.map((cell, d) => (
              <td
                key={d}
                className={cn(
                  "align-top",
                  variant === "plain" && "h-14 lg:h-20",
                  variant === "grid" && "h-14 border border-hairline lg:h-20",
                  variant === "grid" && cell?.isToday && "bg-gold-wash",
                  variant === "editorial" && "h-14 lg:h-20",
                  variant === "tiles" && "h-12 rounded-md lg:h-[72px]",
                  variant === "tiles" && cell && tileColor(cell),
                )}
              >
                {cell && <Day cell={cell} variant={variant} />}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** tiles 칸 바탕. 오늘은 먹색, 토·일은 옅은 빨강, 공휴일은 설정을 끄면 보통 칸으로 돌아간다. */
function tileColor(cell: CalendarDay) {
  if (cell.isToday) return "bg-ink"
  if (isWeekend(cell.weekday)) return "bg-holiday-wash"
  if (cell.holidays.length) return "bg-holiday-wash in-data-[holidays=off]:bg-surface/70"
  return "bg-surface/70"
}

function Day({ cell, variant }: { cell: CalendarDay; variant: CalendarVariant }) {
  const holiday = cell.holidays.length > 0
  const weekend = isWeekend(cell.weekday)
  // 토·일은 늘 빨강, 공휴일만 빨간 날은 설정으로 끄면 먹색으로 돌아간다.
  const color = cn(weekend && "text-holiday", holiday && !weekend && "text-holiday in-data-[holidays=off]:text-ink")
  const names = cell.holidays.join(", ")
  const current = cell.isToday ? ("date" as const) : undefined

  if (variant === "grid")
    return (
      <div className="flex h-full flex-col items-start gap-0.5 p-1 text-left lg:p-1.5">
        <span aria-current={current} className={cn("text-[15px] leading-none font-medium tabular-nums lg:text-base", color, cell.isToday && "font-bold")}>
          {cell.day}
        </span>
        {holiday && (
          <HolidayName names={names} className="w-full truncate text-[9px] leading-tight text-holiday in-data-[holidays=off]:hidden lg:text-[10px]" />
        )}
      </div>
    )

  if (variant === "editorial")
    return (
      <div className="flex h-full flex-col items-start gap-0.5 pt-1.5 text-left">
        <span
          aria-current={current}
          className={cn(
            "font-number text-[26px] leading-none font-light tabular-nums lg:text-[34px]",
            color,
            cell.isToday &&
              "-ml-1 grid size-9 place-items-center rounded-full bg-ink text-[20px] font-normal text-canvas! lg:size-11 lg:text-[26px]",
          )}
        >
          {cell.day}
        </span>
        {holiday && (
          <HolidayName names={names} className="sr-only lg:not-sr-only lg:w-full lg:truncate lg:text-[10px] lg:text-holiday lg:in-data-[holidays=off]:hidden" />
        )}
      </div>
    )

  if (variant === "tiles")
    return (
      <div className="flex h-full flex-col items-center justify-center gap-0.5">
        <span aria-current={current} className={cn("text-base font-semibold tabular-nums lg:text-lg", color, cell.isToday && "text-canvas!")}>
          {cell.day}
        </span>
        {holiday && (
          <HolidayName names={names} className="sr-only lg:not-sr-only lg:w-full lg:truncate lg:px-1 lg:text-[10px] lg:text-holiday lg:in-data-[holidays=off]:hidden" />
        )}
      </div>
    )

  return (
    <div className="flex flex-col items-center gap-0.5 pt-1">
      <span
        aria-current={current}
        className={cn(
          "grid size-8 place-items-center rounded-full text-[17px] tabular-nums lg:size-10 lg:text-lg",
          color,
          cell.isToday && "font-semibold ring-1 ring-ink",
        )}
      >
        {cell.day}
      </span>
      {holiday && (
        // 좁은 칸에서는 두 줄까지 감싸고(낱말 단위), 넘치면 말줄임한다.
        <HolidayName names={names} className="line-clamp-2 w-full px-0.5 text-[11px] leading-tight break-keep text-holiday in-data-[holidays=off]:hidden! lg:line-clamp-1 lg:text-xs" />
      )}
    </div>
  )
}
