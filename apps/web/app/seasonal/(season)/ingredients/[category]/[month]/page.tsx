import { notFound } from "next/navigation"
import { Suspense } from "react"

import { MONTHLY_INGREDIENT_CATEGORIES } from "@workspace/seasonal/data/ingredient-calendar"
import { MONTHS } from "@workspace/seasonal/data/months"

import { IngredientMonthView } from "@/features/seasonal/ingredients/ingredient-month-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

type Props = PageProps<"/seasonal/ingredients/[category]/[month]">

export function generateStaticParams() {
  return MONTHLY_INGREDIENT_CATEGORIES.flatMap(({ slug }) =>
    MONTHS.map((month) => ({ category: slug, month: String(month) }))
  )
}

export async function generateMetadata({ params }: Props) {
  const { category, month } = await params
  const group = MONTHLY_INGREDIENT_CATEGORIES.find(
    ({ slug }) => slug === category
  )
  const value = MONTHS.find((candidate) => String(candidate) === month)
  if (!group || !value) notFound()

  return createMetadata({
    title: `${value}월 ${group.title}`,
    description: `${value}월에 제철인 ${group.label === "수산" ? "수산물" : group.label}과 각 식재료의 제철 기간을 확인하세요.`,
    path: routes.seasonal.ingredientMonth(group.slug, value),
  })
}

async function MonthlyIngredients({ params }: Pick<Props, "params">) {
  const { category, month } = await params
  const group = MONTHLY_INGREDIENT_CATEGORIES.find(
    ({ slug }) => slug === category
  )
  const value = MONTHS.find((candidate) => String(candidate) === month)
  if (!group || !value) notFound()

  return <IngredientMonthView category={group} month={value} />
}

export default function Page({ params }: Props) {
  return (
    <Suspense>
      <MonthlyIngredients params={params} />
    </Suspense>
  )
}
