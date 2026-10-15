import Link from "next/link"

import { PatternBackground } from "@workspace/ui/components/pattern-background"
import { foodsInMonth } from "@workspace/seasonal/data/foods"
import { MONTHS, type Month } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { FoodImage } from "../components/food-image"
import { MonthFoodFold } from "./month-food-fold"
import { ThisMonthTag } from "./this-month-tag"

/**
 * 2b 월별 보기 첫 화면: 열두 달 도감. 달마다 카드 하나에 그 달 제철 품종을 모두 그림·이름으로 늘어놓는다.
 * 카드 머리(달·개수)를 누르면 그 달 상세로, 품종을 누르면 품종 상세(시트)로 간다.
 * 모바일 2열(품종 2개씩), 태블릿 2열·데스크톱 3열(품종 3개씩).
 * 품종이 많은 달은 카드가 정해진 높이에서 아래를 접어 두고, 펼치기로 모두 본다(MonthFoodFold).
 */
export function MonthsIndex() {
  return (
    // 바탕에 옅은 모눈(cojeev grid). 달력·도감 종이 느낌. 위쪽은 탭과 겹치지 않게 서서히 나타난다.
    <div className="relative isolate">
      <PatternBackground
        variant="grid"
        spacing={28}
        color="var(--color-silver)"
        opacity={0.55}
        className="[mask-image:linear-gradient(to_bottom,transparent,black_96px)]"
      />
      <div className="mx-auto max-w-[1080px] px-[18px] pt-2 pb-8 lg:px-6 lg:pt-6">
        <h1 className="sr-only">열두 달 제철</h1>
        {/* items-start: 펼친 카드만 길어지고 같은 줄 카드는 늘어나지 않게 */}
        <ul className="grid grid-cols-2 items-start gap-2.5 lg:grid-cols-3 lg:gap-4">
          {MONTHS.map((month) => (
            <li key={month}>
              <MonthCard month={month} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function MonthCard({ month }: { month: Month }) {
  const foods = foodsInMonth(month)
  return (
    <section
      aria-labelledby={`month-card-${month}`}
      className="@container flex flex-col rounded-lg border border-hairline bg-surface/85 px-2.5 pt-3 pb-4 sm:px-4 sm:pt-3.5 sm:pb-5"
    >
      <Link
        id={`month-card-${month}`}
        href={routes.seasonal.month(month)}
        className="group/head flex items-center gap-1.5 px-0.5 text-ink no-underline hover:text-ink"
      >
        <span className="text-[22px] leading-none font-bold sm:text-2xl">
          {month}월
        </span>
        <span className="text-[13px] text-ash tabular-nums">
          {foods.length}가지
        </span>
        <span className="sr-only">제철 모두 보기</span>
        <ThisMonthTag month={month} />
        <span
          aria-hidden
          className="ml-auto text-sm text-stone transition-transform group-hover/head:translate-x-0.5"
        >
          →
        </span>
      </Link>
      {/* 칸 사이·이름 줄 높이는 MonthFoodFold의 높이 계산 변수(--gx·--gy·--gi·--lh)와 같게 둔다. */}
      <MonthFoodFold month={month} count={foods.length}>
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
      </MonthFoodFold>
    </section>
  )
}
