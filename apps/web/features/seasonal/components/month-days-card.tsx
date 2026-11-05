import { ChevronRight } from "lucide-react"
import Link from "next/link"

import type { CalendarDate } from "@workspace/seasonal/calendar/month-calendar"
import { MONTH_DAY_KIND_LABELS, MONTH_DAY_NOTES, UI_COPY } from "@workspace/seasonal/data/copy"
import { dishNames } from "@workspace/seasonal/data/dishes"
import { festivalOf } from "@workspace/seasonal/data/festivals"
import { monthDays, type MonthDay, type MonthDayKind } from "@workspace/seasonal/data/month-days"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"
import { getSeoulToday } from "@/shared/today"

const KIND_TONE: Record<MonthDayKind, string> = {
  festival: "bg-gold-pale/40 text-gold-deep",
  "solar-term": "bg-sage-pale/60 text-forest",
  custom: "bg-clay/10 text-clay",
}

function noteOf(day: MonthDay): string {
  if (day.kind === "festival" && day.festival) {
    return UI_COPY.festivalDayNote(dishNames(festivalOf(day.festival).traditionalDishes.slice(0, 3)))
  }
  return MONTH_DAY_NOTES[day.id as keyof typeof MONTH_DAY_NOTES]
}

/**
 * 달력 아래 "이달의 절기·명절"(2a 달 섹션, 2b). 명절·이름난 절기·세시를 날짜 순으로 적는다.
 * 명절과 복날은 명절 화면으로 이어진다. 해당 달의 일정만 표시한다.
 */
export function MonthDaysCard({
  month,
  year,
  today,
  className,
}: {
  month: number
  /** 일정을 고르는 해 */
  year: number
  /** 서울 기준 오늘. "오늘" 표시에 쓴다. 미리 그릴 때는 오늘이 없는 날짜(0년 0월 0일)를 넘긴다. */
  today: CalendarDate
  className?: string
}) {
  const days = monthDays(month, year)
  return (
    <section
      aria-label={`${month}월의 절기·명절`}
      className={cn("border-t border-hairline pt-4", className)}
    >
      <h3 className="text-xs font-semibold text-stone">{UI_COPY.monthDaysTitle}</h3>
      {days.length ? (
        <ul className="mt-2 divide-y divide-hairline">
          {days.map((day) => (
            <li key={day.id}>
              <DayRow day={day} isToday={isSameDay(day.date, today)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs leading-relaxed break-keep text-caption">{UI_COPY.noMonthDay}</p>
      )}
    </section>
  )
}

/** 정적으로 미리 그리는 화면(2b)용. 오늘은 요청 시점에 읽으므로 <Suspense> 안에 둔다. */
export async function MonthDaysCardToday({ month, className }: { month: number; className?: string }) {
  const today = await getSeoulToday()
  return <MonthDaysCard month={month} year={today.year} today={today} className={className} />
}

function isSameDay(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

function DayRow({ day, isToday }: { day: MonthDay; isToday: boolean }) {
  const body = (
    <>
      <span className="font-number text-[15px] leading-none tabular-nums text-ink">
        {day.date.month}.{day.date.day}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="font-heading text-[15px] font-bold text-ink">{day.name}</span>
          <span className={cn("rounded-full px-1.5 py-px text-[10px] leading-4 font-semibold", KIND_TONE[day.kind])}>
            {MONTH_DAY_KIND_LABELS[day.kind]}
          </span>
          {isToday && <span className="text-[10px] font-semibold text-gold">오늘</span>}
        </span>
        <span className="mt-0.5 block text-xs leading-snug break-keep text-stone">{noteOf(day)}</span>
      </span>
      {day.festival ? <ChevronRight size={16} aria-hidden className="text-mute" /> : <span />}
    </>
  )
  const grid = "grid grid-cols-[2.75rem_1fr_1rem] items-center gap-x-3 py-2.5"
  return day.festival ? (
    <Link
      href={routes.seasonal.festival(day.festival)}
      className={cn(
        grid,
        "-mx-2 rounded-lg px-2 no-underline transition-colors hover:bg-surface/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest motion-reduce:transition-none"
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={grid}>{body}</div>
  )
}
