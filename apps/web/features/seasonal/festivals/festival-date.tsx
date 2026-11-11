import Link from "next/link"
import { WEEKDAY_NAMES, weekdayOf } from "@workspace/seasonal/calendar/date-utils"
import { STATIC_YEARS } from "@workspace/seasonal/calendar/static-years"
import { festivalDate, festivalOf, type Festival } from "@workspace/seasonal/data/festivals"
import { Button } from "@workspace/ui/components/button"

import { routes } from "@/shared/routes"
import { TodayHide, TodayShow, todayKey } from "@/shared/today-mark"

/**
 * 올해(서울) 양력 날짜. 하루로 정할 수 없는 명절(삼복)이면 시기만 보인다.
 * 미리 그리는 해마다 날짜를 숨겨 두고 브라우저가 올해 것을 켠다(shared/today-mark).
 */
export function FestivalPeriod({ slug }: { slug: Festival }) {
  const festival = festivalOf(slug)
  return (
    <p className="text-sm text-stone">
      시기 {festival.period}
      {STATIC_YEARS.map((year) => (
        <TodayShow key={year} when={todayKey.year(year)}>
          <YearDate slug={slug} year={year} />
        </TodayShow>
      ))}
    </p>
  )
}

function YearDate({ slug, year }: { slug: Festival; year: number }) {
  const date = festivalDate(slug, year)
  if (!date) return null
  const weekday = WEEKDAY_NAMES[weekdayOf(date)]
  return (
    <>
      {" · "}
      <strong className="font-semibold text-ink">
        {date.year}. {date.month}. {date.day} ({weekday})
      </strong>
    </>
  )
}

/** "{m}월 달력에서 보기". 올해 날짜가 든 달로 간다(정월대보름은 해마다 2월이거나 3월). 날짜가 없으면 대표 달. */
export function CalendarLink({ slug }: { slug: Festival }) {
  const fallback = festivalOf(slug).month
  return (
    <>
      {STATIC_YEARS.map((year) => (
        <TodayShow key={year} when={todayKey.year(year)}>
          <CalendarButton month={festivalDate(slug, year)?.month ?? fallback} />
        </TodayShow>
      ))}
      <TodayHide when={STATIC_YEARS.map(todayKey.year)}>
        <CalendarButton month={fallback} />
      </TodayHide>
    </>
  )
}

function CalendarButton({ month }: { month: number }) {
  return (
    <Button asChild fullWidth>
      <Link href={routes.seasonal.rootAt(month)} className="no-underline">
        {month}월 달력에서 보기 →
      </Link>
    </Button>
  )
}
