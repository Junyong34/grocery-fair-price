"use client"

import Link from "next/link"
import { useState } from "react"

import type { Food } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

/** 나의 식탁 목록 한 줄. 체크박스 | 이름·제철 달 | "먹음". 이름을 누르면 품종 상세로 간다. */
export function FoodRow({ food, eaten, onToggle }: { food: Food; eaten: boolean; onToggle: () => void }) {
  // 켤 때마다 key를 바꿔 "+1"을 다시 띄운다.
  const [pops, setPops] = useState(0)
  const id = `eat-${food.id}`
  return (
    <li className="grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-hairline py-3">
      <span className="relative grid place-items-center">
        <Checkbox
          id={id}
          tone="yellow"
          checked={eaten}
          onCheckedChange={() => {
            if (!eaten) setPops((n) => n + 1)
            onToggle()
          }}
          aria-label={`${food.name} 먹음`}
          className={cn(eaten && "motion-safe:animate-tick")}
        />
        {pops > 0 && (
          <span
            key={pops}
            aria-hidden
            className="pointer-events-none absolute -top-4 font-number text-sm font-semibold text-gold opacity-0 motion-safe:animate-pop"
          >
            +1
          </span>
        )}
      </span>
      <Link href={routes.seasonal.food(food.id)} className="flex min-w-0 flex-col no-underline">
        <span className={cn("truncate font-heading text-[17px] font-bold", eaten ? "text-ink" : "text-stone")}>
          {food.name}
        </span>
        <span className="text-xs text-ash">{formatSeasonMonths(food.months)}</span>
      </Link>
      <label htmlFor={id} className={cn("text-xs", eaten ? "text-gold-deep" : "text-ash")}>
        먹음
      </label>
    </li>
  )
}
