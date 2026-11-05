import Link from "next/link"
import { Suspense } from "react"

import { MONTH_CATEGORY_COPY, MONTH_NOTES } from "@workspace/seasonal/data/copy"
import {
  foodsInMonth,
  foodsInMonthByCategory,
} from "@workspace/seasonal/data/foods"
import type { Month } from "@workspace/seasonal/data/months"
import { Button } from "@workspace/ui/components/button"

import { routes } from "@/shared/routes"

import { DownloadsCard } from "@/shared/downloads/downloads-card"
import { MonthDaysCardToday } from "../components/month-days-card"
import { ShareButton } from "../components/share-button"
import { EatenInMonth } from "./eaten-summary"
import { FoodCard } from "./food-card"
import { FoodGrid, ViewSwitch } from "./food-grid"

const previous = (month: number) => (month === 1 ? 12 : month - 1)
const next = (month: number) => (month === 12 ? 1 : month + 1)

/** 카테고리 첫 문장에 이름을 드는 품종 수. 품종은 카테고리별 소제목(h2) 아래 묶는다("11월 제철 생선" 같은 검색에 답하는 묶음). */
const LEAD_NAMES = 3

/**
 * 2b 월별 제철(명세 3.2) 본문. 한눈에 비교하고 바로 이동하는 화면이라 달력은 없다.
 * 달을 바꾸면 이 본문만 페이드인으로 바뀐다(타임라인은 레이아웃에 남는다).
 * ViewTransition을 쓰지 않는다. 스냅샷이 고정 탭·달 줄·하단 내비 위로 올라오고, 스크롤한 자리에서 두 달의 격자가 겹쳐 깜빡인다.
 */
export function MonthView({ month }: { month: Month }) {
  const foods = foodsInMonth(month)
  const groups = foodsInMonthByCategory(month)
  const note = MONTH_NOTES[month]
  // 절기·명절 카드는 해마다 날짜가 바뀌어 요청 시점의 연도로 그린다. 나머지 본문은 정적이다.
  const monthDays = (
    <Suspense fallback={null}>
      <MonthDaysCardToday month={month} />
    </Suspense>
  )

  return (
    <div
      key={month}
      className="mx-auto max-w-[1080px] px-[18px] pt-5 pb-8 motion-safe:animate-fade-in lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 lg:px-6 lg:pt-8"
    >
      <aside className="flex flex-col gap-2 lg:sticky lg:top-20 lg:self-start">
        <p
          aria-hidden
          className="hidden font-number text-[110px] leading-none tabular-nums lg:block"
        >
          {month}
        </p>
        {/* 모바일은 제목 오른쪽. 데스크톱은 래퍼를 풀어(contents) 공유 버튼만 패널 오른쪽 위, 큰 숫자와 같은 높이에 둔다. */}
        <div className="flex items-start justify-between gap-3 lg:contents">
          <h1 className="font-heading text-[34px] leading-tight break-keep lg:text-xl lg:text-stone">
            <span className="lg:sr-only">{month}월 — </span>
            {note}
          </h1>
          <ShareButton className="-mr-2.5 shrink-0 lg:absolute lg:top-3 lg:right-0 lg:mr-0" />
        </div>
        <p className="text-sm text-stone">
          {foods.length}가지 제철 · 먹은{" "}
          <EatenInMonth ids={foods.map((food) => food.id)} />
          가지
        </p>
        <hr className="my-2 hidden border-hairline lg:block" />
        <div className="hidden lg:block">{monthDays}</div>
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
        <div className="flex items-center justify-end gap-3 lg:justify-between">
          <p className="hidden text-lg font-semibold lg:block">
            {month}월 제철 전체
          </p>
          <ViewSwitch />
        </div>
        {groups.map(({ category, foods: group }) => (
          <section
            key={category}
            aria-labelledby={`month-${category}`}
            className="flex flex-col gap-3 pt-2"
          >
            <div className="flex flex-col gap-1">
              <h2
                id={`month-${category}`}
                className="font-heading text-lg text-ink"
              >
                {MONTH_CATEGORY_COPY.heading(month, category)}
              </h2>
              <p className="text-sm leading-relaxed text-stone">
                {MONTH_CATEGORY_COPY.lead(
                  month,
                  category,
                  group.slice(0, LEAD_NAMES).map((food) => food.name),
                  group.length
                )}
              </p>
            </div>
            <FoodGrid>
              {group.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </FoodGrid>
          </section>
        ))}
        <DownloadsCard
          placement="month-timeline"
          className="mt-4 lg:max-w-[420px]"
        />
      </section>

      <footer className="mt-8 flex flex-col gap-4 lg:hidden">
        {monthDays}
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
