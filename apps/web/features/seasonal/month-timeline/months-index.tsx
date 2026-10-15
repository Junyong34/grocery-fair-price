import Link from "next/link"

import { foodsInMonth } from "@workspace/seasonal/data/foods"
import { MONTHS, type Month } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { FoodImage } from "../components/food-image"
import { ThisMonthTag } from "./this-month-tag"

/**
 * 2b 월별 보기 첫 화면: 열두 달 도감. 달마다 카드 하나에 그 달 제철 품종을 모두 그림·이름으로 늘어놓는다.
 * 카드 머리(달·개수)를 누르면 그 달 상세로, 품종을 누르면 품종 상세(시트)로 간다.
 * 모바일 1열(품종 4개씩), 태블릿 2열, 데스크톱 3열(품종 3개씩).
 */
export function MonthsIndex() {
  return (
    <div className="mx-auto max-w-[1080px] px-[18px] pt-2 pb-8 lg:px-6 lg:pt-6">
      <h1 className="sr-only">열두 달 제철</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
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
      className="h-full rounded-lg border border-hairline bg-surface/45 px-4 pt-3.5 pb-5"
    >
      <Link
        id={`month-card-${month}`}
        href={routes.seasonal.month(month)}
        className="group/head flex items-center gap-1.5 text-ink no-underline hover:text-ink"
      >
        <span className="text-lg font-bold">{month}월</span>
        <span className="text-sm text-ash tabular-nums">{foods.length}</span>
        <span className="sr-only">가지 제철 모두 보기</span>
        <ThisMonthTag month={month} />
        <span aria-hidden className="ml-auto text-sm text-stone transition-transform group-hover/head:translate-x-0.5">
          →
        </span>
      </Link>
      <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-3">
        {foods.map((food) => (
          <li key={food.id}>
            <Link
              href={routes.seasonal.food(food.id)}
              scroll={false}
              className="group/food flex flex-col items-center gap-1.5 text-center text-[13px] text-stone no-underline hover:text-ink"
            >
              <span className="block w-[78%] transition-transform duration-200 group-hover/food:-translate-y-0.5">
                <FoodImage food={food} sizes="88px" />
              </span>
              <span className="w-full truncate">{food.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
