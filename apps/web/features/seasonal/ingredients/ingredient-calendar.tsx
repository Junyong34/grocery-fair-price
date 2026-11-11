"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Suspense, useId, useState } from "react"

import type { FoodCategory } from "@workspace/seasonal/data/foods"
import type { MONTHLY_INGREDIENT_CATEGORIES } from "@workspace/seasonal/data/ingredient-calendar"
import { formatSeasonMonths, MONTHS } from "@workspace/seasonal/data/months"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"
import { useToday } from "@/shared/today-context"

import { PillButton } from "../components/pill"

const PREVIEW_COUNT = 8

type MonthlyCategory = (typeof MONTHLY_INGREDIENT_CATEGORIES)[number]

type CalendarGroup = {
  category: FoodCategory
  monthlyCategory?: MonthlyCategory
  foods: readonly { id: string; name: string; months: readonly number[] }[]
}

function MonthlyLink({ category }: { category: MonthlyCategory }) {
  const { month } = useToday()
  return (
    <Link
      href={routes.seasonal.ingredientMonth(category.slug, month)}
      className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-hairline bg-surface px-3 py-2 text-ink no-underline hover:border-gold"
    >
      <span className="text-sm font-semibold">{category.title}</span>
      <span className="flex items-center gap-1 text-xs text-stone">
        월별 보기 <ArrowRight size={15} aria-hidden />
      </span>
    </Link>
  )
}

export function IngredientCalendar({
  groups,
  initialCategory,
}: {
  groups: readonly CalendarGroup[]
  initialCategory: FoodCategory
}) {
  const [category, setCategory] = useState(initialCategory)
  const [expanded, setExpanded] = useState(false)
  const rowsId = useId()
  const group = groups.find((group) => group.category === category)
  const foods = group?.foods ?? []
  const monthlyCategory = group?.monthlyCategory

  return (
    <>
      <div
        role="group"
        aria-label="식재료 카테고리"
        className="flex flex-wrap gap-1.5 py-1"
      >
        {groups.map((group) => (
          <PillButton
            key={group.category}
            selected={category === group.category}
            className="h-11 px-2.5 after:hidden sm:px-3.5"
            onClick={() => {
              setCategory(group.category)
              setExpanded(false)
            }}
          >
            {group.category}
          </PillButton>
        ))}
      </div>

      {monthlyCategory && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Suspense fallback={<div className="min-h-11" aria-hidden />}>
            <MonthlyLink category={monthlyCategory} />
          </Suspense>
          {category === "수산" && (
            <Link
              href={routes.seasonal.sashimi}
              className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-hairline bg-surface px-3 py-2 text-ink no-underline hover:border-gold"
            >
              <span className="text-sm font-semibold">제철 회</span>
              <span className="flex items-center gap-1 text-xs text-stone">
                월별 횟감 추천 <ArrowRight size={15} aria-hidden />
              </span>
            </Link>
          )}
        </div>
      )}

      <div className="mt-5 mb-2 flex items-center justify-between gap-2">
        <h2 aria-live="polite" className="text-sm font-semibold">
          {category} {foods.length}가지
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-stone">
          <span aria-hidden className="h-2 w-4 rounded-full bg-gold" /> 제철
        </span>
      </div>

      <table
        aria-label="식재료별 제철 기간"
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr className="border-y border-hairline text-xs text-stone tabular-nums">
            <th scope="col" className="h-8 w-[76px] pr-1 text-left sm:w-36">
              식재료
            </th>
            {MONTHS.map((month) => (
              <th
                key={month}
                scope="col"
                aria-label={`${month}월`}
                className="text-center font-medium"
              >
                {month}
                <span className="hidden sm:inline">월</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody id={rowsId}>
          {(expanded ? foods : foods.slice(0, PREVIEW_COUNT)).map(
            ({ id, name, months }) => (
              <tr key={id} className="border-b border-hairline">
                <th
                  scope="row"
                  className="h-10 py-1 pr-1 text-left text-xs leading-snug font-medium [overflow-wrap:anywhere] break-keep sm:text-sm"
                >
                  <Link
                    href={routes.seasonal.food(id)}
                    scroll={false}
                    className="text-ink no-underline hover:underline"
                  >
                    {name}
                    <span className="sr-only">
                      {" "}
                      {formatSeasonMonths(months)}
                    </span>
                  </Link>
                </th>
                {MONTHS.map((month) => {
                  const active = months.includes(month)
                  return (
                    <td key={month}>
                      <span
                        aria-hidden
                        data-in-season={active ? "" : undefined}
                        className={cn(
                          "block h-2",
                          active ? "bg-gold" : "bg-hairline",
                          active &&
                            !months.includes(month - 1) &&
                            "ml-0.5 rounded-l-full",
                          active &&
                            !months.includes(month + 1) &&
                            "mr-0.5 rounded-r-full"
                        )}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          )}
        </tbody>
      </table>

      {foods.length > PREVIEW_COUNT && (
        <PillButton
          selected={false}
          className="mt-3 h-11 after:hidden"
          aria-controls={rowsId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "접기" : `${foods.length}가지 모두 보기 ↓`}
        </PillButton>
      )}
    </>
  )
}
