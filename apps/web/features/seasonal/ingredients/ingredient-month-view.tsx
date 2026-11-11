import Link from "next/link"

import { foodsInMonthByCategory } from "@workspace/seasonal/data/foods"
import type { MONTHLY_INGREDIENT_CATEGORIES } from "@workspace/seasonal/data/ingredient-calendar"
import {
  formatSeasonMonths,
  MONTHS,
  type Month,
} from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { SeasonalMonthChips } from "../components/seasonal-month-chips"
import { SeasonalFoodCard } from "../components/seasonal-food-card"

export function IngredientMonthView({
  category,
  month,
}: {
  category: (typeof MONTHLY_INGREDIENT_CATEGORIES)[number]
  month: Month
}) {
  const foods =
    foodsInMonthByCategory(month).find(
      (group) => group.category === category.label
    )?.foods ?? []

  return (
    <>
      <SeasonalMonthChips
        hrefs={MONTHS.map((value) =>
          routes.seasonal.ingredientMonth(category.slug, value)
        )}
      />
      <article className="mx-auto flex max-w-[720px] flex-col gap-4 px-[18px] pt-3 pb-10 lg:px-6">
        <Link
          href={routes.seasonal.ingredientsFor(category.label)}
          className="self-start text-sm text-stone"
        >
          ← {category.label} 제철 달력
        </Link>

        <header className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-[28px] leading-tight font-bold tracking-tight sm:text-[32px]">
            {month}월 {category.title}
          </h1>
          <span className="shrink-0 rounded-full bg-gold-wash px-2.5 py-1 text-xs font-medium text-gold-deep tabular-nums">
            {foods.length}가지
          </span>
        </header>

        <ul className="grid gap-2.5 sm:grid-cols-2">
          {foods.map((food, index) => (
            <li key={food.id}>
              <SeasonalFoodCard
                food={food}
                description={formatSeasonMonths(food.months)}
                preload={index < 2}
              />
            </li>
          ))}
        </ul>
      </article>
    </>
  )
}
