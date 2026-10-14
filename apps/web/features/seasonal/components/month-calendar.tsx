import { monthCalendar, type CalendarDate } from "@workspace/seasonal/calendar/month-calendar"
import { cn } from "@workspace/ui/lib/utils"

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

/**
 * 한 달 달력(명세 5절, 절기 제외). 모바일은 공휴일을 점으로, 데스크톱은 이름으로 보인다.
 * 공휴일 표시는 설정(data-holidays=off)으로 끌 수 있다. 꺼도 일요일은 빨간 날짜다.
 */
export function MonthCalendar({ year, month, today }: { year: number; month: number; today: CalendarDate }) {
  const weeks = monthCalendar({ year, month, today })
  return (
    <table className="w-full table-fixed border-collapse text-center">
      <caption className="sr-only">
        {year}년 {month}월 달력
      </caption>
      <thead>
        <tr>
          {WEEKDAYS.map((weekday, i) => (
            <th key={weekday} scope="col" className={cn("pb-1 text-[11px] font-normal text-ash", i === 0 && "text-clay")}>
              {weekday}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, w) => (
          <tr key={w}>
            {week.map((cell, d) => {
              if (!cell) return <td key={d} className="h-9 lg:h-14" />
              const holiday = cell.holidays.length > 0
              return (
                <td key={d} className="h-9 align-top lg:h-14">
                  <div className="flex flex-col items-center gap-0.5 pt-1">
                    <span
                      aria-current={cell.isToday ? "date" : undefined}
                      className={cn(
                        "grid size-[22px] place-items-center rounded-full text-[13px] tabular-nums",
                        cell.weekday === 0 && "text-clay",
                        holiday && "text-clay in-data-[holidays=off]:text-ink",
                        cell.weekday === 0 && holiday && "in-data-[holidays=off]:text-clay",
                        cell.isToday && "font-semibold ring-1 ring-ink",
                      )}
                    >
                      {cell.day}
                    </span>
                    {holiday && (
                      <>
                        <span aria-hidden className="size-1 rounded-full bg-gold in-data-[holidays=off]:hidden lg:hidden" />
                        <span className="sr-only lg:not-sr-only lg:w-full lg:truncate lg:px-0.5 lg:text-[10px] lg:leading-tight lg:text-clay lg:in-data-[holidays=off]:hidden">
                          {cell.holidays.join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
