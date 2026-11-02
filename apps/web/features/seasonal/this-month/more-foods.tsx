import Link from "next/link"

import type { Food } from "@workspace/seasonal/data/foods"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible"

import { EatenName } from "@/features/seasonal/components/eaten-name"
import { FoodImage } from "@/features/seasonal/components/food-image"
import { routes } from "@/shared/routes"

/**
 * 흩뿌리기 판에 그리지 않은 그 달 제철 품종(판에는 대표 SCATTER_MAX_FOODS개만 그린다). 접어 두고, 펼치면 그림과 이름을 함께 보여 주고, 누르면 품종 시트가 열린다.
 * 차례는 monthHighlights와 같다(그 달이 대표 달인 품종 먼저).
 */
export function MoreFoods({ foods, year }: { foods: readonly Food[]; year: number }) {
  if (foods.length === 0) return null
  return (
    <Collapsible className="mt-4 border-t border-hairline pt-1">
      <CollapsibleTrigger className="min-h-11 text-xs text-stone">그 밖의 제철 {foods.length}가지</CollapsibleTrigger>
      {/* 아래로 열한 달이 이어지는 긴 문서라 높이를 애니메이션하면 매 프레임 레이아웃이 다시 돈다. 바로 펼치고 목록만 떠오르게 한다. */}
      <CollapsibleContent animateHeight={false} className="[&_[data-disclosure-inner]]:bg-transparent! [&_[data-disclosure-inner]]:p-0!">
        <ul className="motion-safe:animate-rise grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-x-2 gap-y-3 py-3">
          {foods.map((food) => (
            <li key={food.id} className="min-w-0">
              <Link href={routes.seasonal.food(food.id)} scroll={false} className="group flex h-full flex-col items-center gap-2 rounded-xl px-1 py-2 text-center text-ink transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none">
                <div aria-hidden="true" className="w-14 shrink-0">
                  <FoodImage food={food} sizes="56px" />
                </div>
                <span className="text-[13px] leading-snug break-keep group-hover:underline group-hover:decoration-hairline group-hover:underline-offset-4"><EatenName year={year} foodId={food.id}>{food.name}</EatenName></span>
              </Link>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
