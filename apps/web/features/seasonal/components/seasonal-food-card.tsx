import Link from "next/link"
import type { ReactNode } from "react"

import type { Food } from "@workspace/seasonal/data/foods"

import { routes } from "@/shared/routes"

import { FoodImage } from "./food-image"

export function SeasonalFoodCard({
  food,
  badge,
  description,
  preload,
}: {
  food: Food
  badge?: ReactNode
  description?: string
  preload: boolean
}) {
  return (
    <Link
      href={routes.seasonal.food(food.id)}
      scroll={false}
      className="group flex h-full items-center gap-3.5 rounded-xl border border-hairline bg-surface/85 p-3 text-ink no-underline transition-colors duration-200 hover:border-gold hover:bg-gold-wash/65 hover:text-ink"
    >
      <span className="block size-16 shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105">
        <FoodImage food={food} sizes="64px" preload={preload} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-1.5 text-base leading-snug font-semibold">
          {food.name}
          {badge && (
            <span className="rounded-full bg-gold-wash px-2 py-0.5 text-[11px] font-medium text-gold-deep">
              {badge}
            </span>
          )}
        </span>
        {description && (
          <span className="text-[13px] leading-snug text-stone">
            {description}
          </span>
        )}
      </span>
    </Link>
  )
}
