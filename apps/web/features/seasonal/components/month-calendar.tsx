import { WEEKDAY_NAMES } from "@workspace/seasonal/calendar/date-utils"
import type { MonthHolidays } from "@workspace/seasonal/calendar/holidays"
import { monthCalendar, type CalendarDate, type CalendarDay } from "@workspace/seasonal/calendar/month-calendar"
import type { CalendarVariant } from "@workspace/seasonal/calendar/variants"
import { cn } from "@workspace/ui/lib/utils"

import { TodayHide, TodayShow, todayKey } from "@/shared/today-mark"

import { HolidayName } from "./holiday-name"

/** 토요일(6)·일요일(0) */
const isWeekend = (weekday: number) => weekday === 0 || weekday === 6

/** 오늘 표시가 없는 날짜. 인쇄물처럼 오늘을 그리지 않을 때 넘긴다. */
export const NO_TODAY: CalendarDate = { year: 0, month: 0, day: 0 }

/**
 * 한 달 달력(명세 5절, 절기 제외). 토·일·공휴일은 빨간 숫자다.
 * 공휴일 표시 설정(data-holidays=off)을 끄면 공휴일 이름과 빨간 표시가 함께 사라진다. 토·일은 그대로 빨간 날짜다.
 * 오늘 동그라미는 두 방식이다. today로 날짜를 넘기거나(인쇄물은 NO_TODAY), markToday로 날마다 오늘 모양을 숨겨 두고
 * 브라우저가 첫 그리기 전에 그날 것만 켠다(정적 페이지, shared/today-mark).
 */
export function MonthCalendar({
  year,
  month,
  today = NO_TODAY,
  markToday = false,
  holidays,
  variant = "plain",
}: {
  year: number
  month: number
  today?: CalendarDate
  /** 날마다 오늘 모양을 숨겨 두고 브라우저가 그날 것을 켠다. today는 무시한다. */
  markToday?: boolean
  /** 그 달 공휴일. 서버에서 holidaysInMonth로 구해 넘긴다. */
  holidays: MonthHolidays
  variant?: CalendarVariant
}) {
  const weeks = monthCalendar({ year, month, today: markToday ? NO_TODAY : today, holidays })
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
                "text-[11px] font-normal text-caption",
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
                {cell &&
                  (markToday ? (
                    <>
                      <TodayHide when={todayKey.day({ year, month, day: cell.day })}>
                        <Day cell={cell} variant={variant} />
                      </TodayHide>
                      <TodayShow when={todayKey.day({ year, month, day: cell.day })}>
                        <Day cell={{ ...cell, isToday: true }} variant={variant} fillToday />
                      </TodayShow>
                    </>
                  ) : (
                    <Day cell={cell} variant={variant} />
                  ))}
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

/**
 * 한 칸의 내용. fillToday면 칸 바탕(grid · tiles의 오늘 색)을 td 대신 이 안에서 깐다.
 * markToday 달력은 td를 오늘이 아닌 모양으로 그리므로, 오늘 바탕은 숨겨 둔 오늘 모양 쪽이 가져야 한다.
 */
function Day({ cell, variant, fillToday = false }: { cell: CalendarDay; variant: CalendarVariant; fillToday?: boolean }) {
  const fill =
    fillToday && cell.isToday && (variant === "grid" || variant === "tiles") ? (
      <span aria-hidden className={cn("absolute -inset-px -z-10", variant === "tiles" ? "rounded-md bg-ink" : "bg-gold-wash")} />
    ) : null
  const holiday = cell.holidays.length > 0
  const weekend = isWeekend(cell.weekday)
  // 토·일은 늘 빨강, 공휴일만 빨간 날은 설정으로 끄면 먹색으로 돌아간다.
  const color = cn(weekend && "text-holiday", holiday && !weekend && "text-holiday in-data-[holidays=off]:text-ink")
  const names = cell.holidays.join(", ")
  const current = cell.isToday ? ("date" as const) : undefined

  if (variant === "grid")
    return (
      <div className={cn("flex h-full flex-col items-start gap-0.5 p-1 text-left lg:p-1.5", fill && "relative isolate")}>
        {fill}
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
      <div className={cn("flex h-full flex-col items-center justify-center gap-0.5", fill && "relative isolate")}>
        {fill}
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
        // 긴 공휴일 이름도 좁은 칸 안에서 읽도록 작은 글자로 감싸고 말줄임하지 않는다.
        <HolidayName names={names} className="w-full px-0.5 text-[8px] leading-tight break-all text-holiday in-data-[holidays=off]:hidden! lg:text-[10px]" />
      )}
    </div>
  )
}
