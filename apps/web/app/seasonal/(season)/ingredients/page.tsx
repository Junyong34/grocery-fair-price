import { Suspense } from "react"

import {
  INGREDIENT_CATEGORIES,
  MONTHLY_INGREDIENT_CATEGORIES,
  foodsForIngredientCalendar,
} from "@workspace/seasonal/data/ingredient-calendar"

import { IngredientCalendar } from "@/features/seasonal/ingredients/ingredient-calendar"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: "제철 식재료",
  description:
    "과일, 채소, 수산물, 버섯, 곡물·견과의 1~12월 제철 시기를 한눈에 확인하세요.",
  path: routes.seasonal.ingredients,
})

const groups = INGREDIENT_CATEGORIES.map((category) => ({
  category,
  monthlyCategory: MONTHLY_INGREDIENT_CATEGORIES.find(
    ({ label }) => label === category
  ),
  foods: foodsForIngredientCalendar(category).map(({ id, name, months }) => ({
    id,
    name,
    months,
  })),
}))

async function CalendarSelection({
  searchParams,
}: Pick<PageProps<"/seasonal/ingredients">, "searchParams">) {
  const { category } = await searchParams
  const initialCategory =
    INGREDIENT_CATEGORIES.find((value) => value === category) ?? "과일"
  return (
    <IngredientCalendar
      key={initialCategory}
      groups={groups}
      initialCategory={initialCategory}
    />
  )
}

export default function Page({
  searchParams,
}: PageProps<"/seasonal/ingredients">) {
  return (
    <article className="mx-auto max-w-[720px] px-3 pt-5 pb-10 sm:px-6">
      <h1 className="mb-3 font-heading text-[28px] leading-tight font-bold tracking-tight sm:text-[32px]">
        제철 식재료
      </h1>
      <Suspense
        fallback={<IngredientCalendar groups={groups} initialCategory="과일" />}
      >
        <CalendarSelection searchParams={searchParams} />
      </Suspense>
    </article>
  )
}
