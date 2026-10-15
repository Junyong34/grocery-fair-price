import Link from "next/link"

import { foodsInMonth } from "@workspace/seasonal/data/foods"
import { MONTHS, type Month } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { FoodImage } from "../components/food-image"
import { MonthFoodScroll } from "./month-food-scroll"
import { ThisMonthTag } from "./this-month-tag"

/**
 * 2b 월별 보기 첫 화면: 열두 달 도감. 달마다 카드 하나에 그 달 제철 품종을 모두 그림·이름으로 늘어놓는다.
 * 카드 머리(달·개수)를 누르면 그 달 상세로, 품종을 누르면 품종 상세(시트)로 간다.
 * 모바일 2열(품종 2개씩), 태블릿 2열·데스크톱 3열(품종 3개씩).
 * 품종이 많은 달은 카드가 정해진 높이에서 안쪽으로 스크롤하고, 펼치기로 모두 본다(MonthFoodScroll).
 */
export function MonthsIndex() {
  return (
    <div className="mx-auto max-w-[1080px] px-[18px] pt-2 pb-8 lg:px-6 lg:pt-6">
      <h1 className="sr-only">열두 달 제철</h1>
      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-4">
        {MONTHS.map((month) => (
          <li key={month}>
            <MonthCard month={month} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function MonthCard({ month }: { month: Month }) {
  const foods = foodsInMonth(month)
  return (
    <section
      aria-labelledby={`month-card-${month}`}
      className="@container flex h-full flex-col rounded-lg border border-hairline bg-surface/45 px-2.5 pt-3 pb-4 sm:px-4 sm:pt-3.5 sm:pb-5"
    >
      <Link
        id={`month-card-${month}`}
        href={routes.seasonal.month(month)}
        className="group/head flex items-center gap-1.5 px-0.5 text-ink no-underline hover:text-ink"
      >
        <span className="text-[22px] leading-none font-bold sm:text-2xl">{month}월</span>
        <span className="text-[13px] text-ash tabular-nums">{foods.length}가지</span>
        <span className="sr-only">제철 모두 보기</span>
        <ThisMonthTag month={month} />
        <span
          aria-hidden
          className="ml-auto text-sm text-stone transition-transform group-hover/head:translate-x-0.5"
        >
          →
        </span>
      </Link>
      {/* 칸 사이·이름 줄 높이는 MonthFoodScroll의 높이 계산 변수(--gx·--gy·--gi·--lh)와 같게 둔다. */}
      <MonthFoodScroll month={month} count={foods.length}>
        <ul className="grid grid-cols-2 gap-x-1.5 gap-y-2 sm:grid-cols-3 sm:gap-x-2 sm:gap-y-3">
          {foods.map((food) => (
            <li key={food.id}>
              <Link
                href={routes.seasonal.food(food.id)}
                scroll={false}
                className="group/food flex flex-col items-center gap-1 text-center text-xs leading-4 text-stone no-underline hover:text-ink sm:gap-1.5 sm:text-[13px] sm:leading-5"
              >
                <span className="block w-[84%] transition-transform duration-200 group-hover/food:-translate-y-0.5">
                  <FoodImage food={food} sizes="88px" />
                </span>
                <span className="w-full truncate">{food.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </MonthFoodScroll>
    </section>
  )
}
