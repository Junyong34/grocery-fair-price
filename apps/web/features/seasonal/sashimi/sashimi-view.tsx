import Link from "next/link"

import { SASHIMI_COPY } from "@workspace/seasonal/data/copy"
import type { Month } from "@workspace/seasonal/data/months"
import { isSashimiPick, sashimiInMonth } from "@workspace/seasonal/data/sashimi"

import { routes } from "@/shared/routes"

import { SeasonalFoodCard } from "../components/seasonal-food-card"

/**
 * 제철 회 화면(.scratch/sashimi/spec.md 3장): 그 달 제목과 품종 수, 회 카드 목록, 안내 한 줄.
 * 목록은 그 달이 제철인 회 품종 전부이고, 이달 추천(isSashimiPick: 흔히 먹는 회 중 그 달이 절정인 것)은 앞에 두고 "이달 추천"을 붙인다.
 * 달 칩은 레이아웃(sashimi-month-chips)에 있다. 카드를 누르면 1i가 시트로 열린다(@sheet 가로채기). 먹음 기록은 하지 않는다.
 */
export function SashimiView({ month }: { month: Month }) {
  const foods = sashimiInMonth(month)
  return (
    <article className="mx-auto flex max-w-[720px] flex-col gap-4 px-[18px] pt-3 pb-10 lg:px-6">
      <Link href={routes.seasonal.ingredientsFor("수산")} className="self-start text-sm text-stone">
        ← 수산 제철 달력
      </Link>
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] leading-tight font-bold tracking-tight sm:text-[32px]">
            {SASHIMI_COPY.pageTitle(month)}
          </h1>
          <p className="font-heading text-[15px] text-stone sm:text-base">
            {SASHIMI_COPY.monthTitles[month]}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gold-wash px-2.5 py-1 text-xs font-medium text-gold-deep tabular-nums">
          {SASHIMI_COPY.count(foods.length)}
        </span>
      </header>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {foods.map((food, index) => (
          <li key={food.id}>
            <SeasonalFoodCard
              food={food}
              badge={isSashimiPick(food.id, month) ? SASHIMI_COPY.pick : undefined}
              description={SASHIMI_COPY.descriptions[food.id]}
              preload={index < 2}
            />
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-caption">
        {SASHIMI_COPY.notice}
      </p>
    </article>
  )
}
