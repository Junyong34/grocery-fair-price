"use client"

import Link from "next/link"
import { Suspense } from "react"

import {
  festivalDate,
  FESTIVALS,
  type Festival,
} from "@workspace/seasonal/data/festivals"
import { Button } from "@workspace/ui/components/button"

import { routes } from "@/shared/routes"
import { useToday } from "@/shared/today-context"

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
const find = (slug: Festival) =>
  FESTIVALS.find((festival) => festival.slug === slug)!

/**
 * 올해(서울) 양력 날짜. 날짜 표에 없는 연도이거나 하루로 정할 수 없는 명절(삼복)이면 시기만 보인다.
 * 연도는 요청 시점 값이라 Suspense 안에서 읽는다.
 */
export function FestivalPeriod({ slug }: { slug: Festival }) {
  const festival = find(slug)
  return (
    <p className="text-sm text-stone">
      시기 {festival.period}
      <Suspense>
        <ThisYearDate slug={slug} />
      </Suspense>
    </p>
  )
}

function ThisYearDate({ slug }: { slug: Festival }) {
  const { year } = useToday()
  const date = festivalDate(slug, year)
  if (!date) return null
  const weekday =
    WEEKDAYS[
      new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()
    ]
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
  return (
    <Suspense fallback={<CalendarButton month={find(slug).month} />}>
      <ThisYearCalendarLink slug={slug} />
    </Suspense>
  )
}

function ThisYearCalendarLink({ slug }: { slug: Festival }) {
  const { year } = useToday()
  return (
    <CalendarButton
      month={festivalDate(slug, year)?.month ?? find(slug).month}
    />
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
