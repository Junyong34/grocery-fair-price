"use client"

import Link from "next/link"
import { useState } from "react"

import {
  EAT_LABEL_OFF,
  eatLabel,
  hashString,
} from "@workspace/seasonal/data/copy"
import { isDrawn, type Food } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { cn } from "@workspace/ui/lib/utils"

import { FoodImage } from "@/features/seasonal/components/food-image"
import { routes } from "@/shared/routes"

/** 나의 식탁 목록 한 줄. 체크박스 | 이미지 | 이름·제철 달 | 라벨. 이름을 누르면 품종 상세로 간다. */
export function FoodRow({
  food,
  eaten,
  onToggle,
}: {
  food: Food
  eaten: boolean
  onToggle: () => void
}) {
  // 켤 때마다 key를 바꿔 이미지 바운스와 "+1"을 다시 띄운다.
  const [pops, setPops] = useState(0)
  // 방금 체크해서 뽑은 문구. 다시 열면 없고, 그때는 품종 id 해시로 고정한 문구를 쓴다.
  const [fresh, setFresh] = useState<string | null>(null)
  const id = `eat-${food.id}`
  const label = eaten ? (fresh ?? eatLabel(hashString(food.id))) : EAT_LABEL_OFF
  return (
    <li className="grid grid-cols-[24px_40px_1fr_auto] items-center gap-3 border-b border-hairline py-2.5">
      <Checkbox
        id={id}
        tone="yellow"
        checked={eaten}
        onCheckedChange={() => {
          if (eaten) {
            setFresh(null)
          } else {
            setPops((n) => n + 1)
            setFresh(eatLabel(Math.floor(Math.random() * 1000)))
          }
          onToggle()
        }}
        aria-label={`${food.name} 먹음`}
      />
      <span className="relative grid size-10 place-items-center">
        <span
          key={pops}
          className={cn(
            "grid size-full place-items-center transition-[opacity,filter] duration-300",
            eaten ? "opacity-100" : "opacity-45 saturate-50",
            pops > 0 && eaten && "motion-safe:animate-bounce-in"
          )}
        >
          {isDrawn(food.id) ? (
            <FoodImage food={food} sizes="40px" showName={false} />
          ) : (
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full border border-dashed border-silver bg-surface/50 font-heading text-sm text-stone"
            >
              {food.name.charAt(0)}
            </span>
          )}
        </span>
        {pops > 0 && eaten && (
          <span
            key={`plus-${pops}`}
            aria-hidden
            className="pointer-events-none absolute -top-2 font-number text-2xl font-bold text-gold-deep opacity-0 motion-safe:animate-plus-one"
          >
            +1
          </span>
        )}
      </span>
      <Link
        href={routes.seasonal.food(food.id)}
        className="flex min-w-0 flex-col no-underline"
      >
        <span
          className={cn(
            "truncate font-heading text-[17px] font-bold",
            eaten ? "text-ink" : "text-stone"
          )}
        >
          {food.name}
        </span>
        <span className="text-xs text-ash">
          {formatSeasonMonths(food.months)}
        </span>
      </Link>
      <label
        htmlFor={id}
        className={cn(
          "text-xs",
          eaten ? "font-semibold text-gold-deep" : "text-ash"
        )}
      >
        {label}
      </label>
    </li>
  )
}
