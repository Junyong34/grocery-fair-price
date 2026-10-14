import Link from "next/link"
import { ViewTransition } from "react"

import { MONTH_NOTES, UI_COPY } from "@workspace/seasonal/data/copy"
import { FESTIVALS } from "@workspace/seasonal/data/festivals"
import { foodsInMonth } from "@workspace/seasonal/data/foods"
import type { Month } from "@workspace/seasonal/data/months"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"
import { Button } from "@workspace/ui/components/button"

import { routes } from "@/shared/routes"

import { SeasonTag } from "../components/season-tag"
import { EatenInMonth } from "./eaten-summary"
import { FoodCard } from "./food-card"
import { FoodGrid, ViewSwitch } from "./food-grid"

const previous = (month: number) => (month === 1 ? 12 : month - 1)
const next = (month: number) => (month === 12 ? 1 : month + 1)

/**
 * 2b 월별 제철(명세 3.2) 본문. 한눈에 비교하고 바로 이동하는 화면이라 달력은 없다.
 * 달을 바꾸면 이 본문만 크로스페이드로 바뀐다(타임라인은 레이아웃에 남는다).
 */
export function MonthView({ month }: { month: Month }) {
  const foods = foodsInMonth(month)
  const season = seasonOfMonth(month)
  const note = MONTH_NOTES[month]
  // 명절 줄은 대표 달 기준이다. 연도에 따라 바뀌는 날짜(정월대보름 2·3월)는 2a 달력이 보여 준다.
  const festivals = FESTIVALS.filter((festival) => festival.month === month)

  const festivalLine = festivals.length
    ? `명절 · ${festivals.map((festival) => festival.name).join(", ")}`
    : UI_COPY.noFestivalThisMonth

  return (
    <ViewTransition
      key={month}
      name="month-content"
      share="auto"
      enter="auto"
      default="none"
    >
      <div className="mx-auto max-w-[1080px] px-[18px] pt-5 pb-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 lg:px-6 lg:pt-8">
        <aside className="flex flex-col gap-2 lg:sticky lg:top-20 lg:self-start">
          <SeasonTag season={season} className="self-start" />
          <p
            aria-hidden
            className="hidden font-number text-[110px] leading-none tabular-nums lg:block"
          >
            {month}
          </p>
          <h1 className="font-heading text-[34px] leading-tight lg:text-xl lg:text-stone">
            <span className="lg:sr-only">{month}월 — </span>
            {note}
          </h1>
          <p className="text-sm text-stone">
            {foods.length}가지 제철 · 먹은{" "}
            <EatenInMonth ids={foods.map((food) => food.id)} />
            가지
          </p>
          <hr className="my-2 hidden border-hairline lg:block" />
          <p className="hidden text-sm text-stone lg:block">{festivalLine}</p>
          <div className="mt-2 hidden gap-2 lg:flex">
            <MonthStep month={previous(month)} direction="previous" />
            <MonthStep month={next(month)} direction="next" />
          </div>
          <Link
            href={routes.seasonal.rootAt(month)}
            className="mt-2 hidden text-sm text-stone lg:block"
          >
            메인에서 이 달 달력 보기 →
          </Link>
        </aside>

        <section
          aria-label={`${month}월 제철 전체`}
          className="mt-6 flex flex-col gap-4 lg:mt-0"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="hidden text-lg font-semibold lg:block">
              {month}월 제철 전체
            </h2>
            <span className="shrink-0 text-sm text-stone lg:hidden">보기</span>
            <ViewSwitch />
          </div>
          <FoodGrid>
            {foods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </FoodGrid>
        </section>

        <footer className="mt-8 flex flex-col gap-4 lg:hidden">
          <p className="text-sm text-stone">{festivalLine}</p>
          <div className="flex items-center justify-between gap-2">
            <MonthStep month={previous(month)} direction="previous" />
            <Link
              href={routes.seasonal.rootAt(month)}
              className="text-sm text-stone"
            >
              메인에서 달력 보기
            </Link>
            <MonthStep month={next(month)} direction="next" />
          </div>
        </footer>
      </div>
    </ViewTransition>
  )
}

function MonthStep({
  month,
  direction,
}: {
  month: number
  direction: "previous" | "next"
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link
        href={routes.seasonal.month(month)}
        scroll={false}
        className="no-underline"
      >
        {direction === "previous" ? `‹ ${month}월` : `${month}월 ›`}
      </Link>
    </Button>
  )
}
