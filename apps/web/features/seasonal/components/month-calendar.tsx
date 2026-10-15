import { monthCalendar, type CalendarDate, type CalendarDay } from "@workspace/seasonal/calendar/month-calendar"
import { cn } from "@workspace/ui/lib/utils"

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

/** 토요일(6)·일요일(0) */
const isWeekend = (weekday: number) => weekday === 0 || weekday === 6

/**
 * 달력 모양 후보(/examples/calendar-styles에서 비교).
 * - plain: 선 없이 작은 숫자, 공휴일은 점(모바일)·이름(데스크톱)
 * - grid: 칸마다 가는 선, 숫자는 칸 왼쪽 위, 공휴일 이름을 칸 안에
 * - editorial: 큰 가는 숫자, 주 사이 가로줄만, 오늘은 먹색 원
 * - tiles: 날마다 둥근 타일, 빨간 날은 옅은 빨강 타일
 */
export const CALENDAR_VARIANTS = ["plain", "grid", "editorial", "tiles"] as const
export type CalendarVariant = (typeof CALENDAR_VARIANTS)[number]

/**
 * 한 달 달력(명세 5절, 절기 제외). 토·일·공휴일은 빨간 숫자다.
 * 공휴일 표시는 설정(data-holidays=off)으로 끌 수 있다. 꺼도 토·일은 빨간 날짜다.
 */
export function MonthCalendar({
  year,
  month,
  today,
  variant = "plain",
}: {
  year: number
  month: number
  today: CalendarDate
  variant?: CalendarVariant
}) {
  const weeks = monthCalendar({ year, month, today })
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
          {WEEKDAYS.map((weekday, i) => (
            <th
              key={weekday}
              scope="col"
              className={cn(
                "text-[11px] font-normal text-ash",
                variant === "plain" && "pb-1",
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
                  variant === "plain" && "h-9 lg:h-14",
                  variant === "grid" && "h-12 border border-hairline lg:h-16",
                  variant === "grid" && cell?.isToday && "bg-gold-wash",
                  variant === "editorial" && "h-12 lg:h-16",
                  variant === "tiles" && "h-10 rounded-md lg:h-14",
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
        <span aria-current={current} className={cn("text-[13px] leading-none font-medium tabular-nums", color, cell.isToday && "font-bold")}>
          {cell.day}
        </span>
        {holiday && (
          <span className="w-full truncate text-[9px] leading-tight text-holiday in-data-[holidays=off]:hidden lg:text-[10px]">
            {names}
          </span>
        )}
      </div>
    )

  if (variant === "editorial")
    return (
      <div className="flex h-full flex-col items-start gap-0.5 pt-1.5 text-left">
        <span
          aria-current={current}
          className={cn(
            "font-number text-[22px] leading-none font-light tabular-nums lg:text-[28px]",
            color,
            cell.isToday &&
              "-ml-1 grid size-8 place-items-center rounded-full bg-ink text-[18px] font-normal text-canvas! lg:size-9 lg:text-[22px]",
          )}
        >
          {cell.day}
        </span>
        {holiday && (
          <span className="sr-only lg:not-sr-only lg:w-full lg:truncate lg:text-[10px] lg:text-holiday lg:in-data-[holidays=off]:hidden">
            {names}
          </span>
        )}
      </div>
    )

  if (variant === "tiles")
    return (
      <div className="flex h-full flex-col items-center justify-center gap-0.5">
        <span aria-current={current} className={cn("text-sm font-semibold tabular-nums", color, cell.isToday && "text-canvas!")}>
          {cell.day}
        </span>
        {holiday && (
          <span className="sr-only lg:not-sr-only lg:w-full lg:truncate lg:px-1 lg:text-[10px] lg:text-holiday lg:in-data-[holidays=off]:hidden">
            {names}
          </span>
        )}
      </div>
    )

  return (
    <div className="flex flex-col items-center gap-0.5 pt-1">
      <span
        aria-current={current}
        className={cn(
          "grid size-[22px] place-items-center rounded-full text-[13px] tabular-nums",
          color,
          cell.isToday && "font-semibold ring-1 ring-ink",
        )}
      >
        {cell.day}
      </span>
      {holiday && (
        <>
          <span aria-hidden className="size-1 rounded-full bg-holiday in-data-[holidays=off]:hidden lg:hidden" />
          <span className="sr-only lg:not-sr-only lg:w-full lg:truncate lg:px-0.5 lg:text-[10px] lg:leading-tight lg:text-holiday lg:in-data-[holidays=off]:hidden">
            {names}
          </span>
        </>
      )}
    </div>
  )
}
