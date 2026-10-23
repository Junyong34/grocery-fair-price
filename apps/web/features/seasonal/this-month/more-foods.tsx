import Link from "next/link"

import type { Food } from "@workspace/seasonal/data/foods"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible"

import { routes } from "@/shared/routes"

/**
 * 흩뿌리기 판에 그리지 않은 그 달 제철 품종(판에는 대표 SCATTER_MAX_FOODS개만 그린다). 접어 두고, 펼치면 이름을 누르면 품종 시트가 열린다.
 * 차례는 monthHighlights와 같다(그 달이 대표 달인 품종 먼저).
 */
export function MoreFoods({ foods }: { foods: readonly Food[] }) {
  if (foods.length === 0) return null
  return (
    <Collapsible className="mt-2">
      <CollapsibleTrigger className="min-h-11 text-xs text-stone">그 밖의 제철 {foods.length}가지</CollapsibleTrigger>
      <CollapsibleContent className="[&_[data-disclosure-inner]]:bg-transparent [&_[data-disclosure-inner]]:p-0">
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5 pb-2 text-sm">
          {foods.map((food) => (
            <li key={food.id}>
              <Link href={routes.seasonal.food(food.id)} scroll={false} className="text-ink underline decoration-hairline underline-offset-4 hover:text-ink">
                {food.name}
              </Link>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
