import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { MONTHLY_INGREDIENT_CATEGORIES } from "@workspace/seasonal/data/ingredient-calendar"
import { MONTHS } from "@workspace/seasonal/data/months"

import { SeasonalMonthChips } from "@/features/seasonal/components/seasonal-month-chips"
import { routes } from "@/shared/routes"

type Props = LayoutProps<"/seasonal/ingredients/[category]">

async function IngredientCategory({ children, params }: Props) {
  const { category } = await params
  const group = MONTHLY_INGREDIENT_CATEGORIES.find(
    ({ slug }) => slug === category
  )
  if (!group) notFound()

  return (
    <>
      <SeasonalMonthChips
        hrefs={MONTHS.map((month) =>
          routes.seasonal.ingredientMonth(group.slug, month)
        )}
        preserveScroll
      />
      <article className="mx-auto flex max-w-[720px] flex-col gap-4 px-[18px] pt-3 pb-10 lg:px-6">
        <Link
          href={routes.seasonal.ingredientsFor(group.label)}
          className="self-start text-sm text-stone"
        >
          ← {group.label} 제철 달력
        </Link>
        {children}
      </article>
    </>
  )
}

export default function IngredientCategoryLayout({ children, params }: Props) {
  return (
    <Suspense>
      <IngredientCategory params={params}>{children}</IngredientCategory>
    </Suspense>
  )
}
