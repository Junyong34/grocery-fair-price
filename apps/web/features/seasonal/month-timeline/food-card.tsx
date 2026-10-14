import Link from "next/link"

import type { Food } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { EatenBadgeToday } from "../components/eaten-badge"
import { FoodImage } from "../components/food-image"
import { SeasonMonthsBar } from "../components/season-months-bar"
import { EatToggle } from "../food-detail/eat-toggle"

// 카드 모양은 그리드의 data-mobile(모바일) / data-desktop(lg 이상) 값을 따른다. 두 구간을 max-lg:와 lg:로 나눠 서로 덮어쓰지 않게 한다.
// 상세 카드에만 보이는 부분.
const DETAIL_ONLY =
  "hidden max-lg:group-data-[mobile=detail]/grid:flex lg:group-data-[desktop=detail]/grid:flex"
const DETAIL_ONLY_INLINE =
  "hidden max-lg:group-data-[mobile=detail]/grid:inline lg:group-data-[desktop=detail]/grid:inline"
// 컴팩트 카드에만 보이는 부분.
const COMPACT_ONLY =
  "max-lg:group-data-[mobile=detail]/grid:hidden lg:group-data-[desktop=detail]/grid:hidden"

/** 2b 품종 카드(명세 3.2). 상세 카드는 그림·이름·12칸 막대·먹었어요, 컴팩트는 그림·이름·✓. */
export function FoodCard({ food }: { food: Food }) {
  return (
    <li className="flex min-w-0 flex-col gap-2">
      <Link
        href={routes.seasonal.food(food.id)}
        className="flex flex-col gap-1.5 text-ink no-underline hover:text-ink"
      >
        <span className="relative block rounded-md bg-surface/60 p-2">
          <FoodImage
            food={food}
            sizes="(min-width: 1024px) 200px, 45vw"
            showName={false}
          />
          <span className={COMPACT_ONLY}>
            <EatenBadgeToday foodId={food.id} />
          </span>
        </span>
        <span className="truncate text-xs font-semibold max-lg:group-data-[mobile=detail]/grid:text-[15px] lg:text-sm">
          {food.name}
          <span className={DETAIL_ONLY_INLINE}> →</span>
        </span>
      </Link>
      <div className={`${DETAIL_ONLY} flex-col gap-2`}>
        <SeasonMonthsBar months={food.months} />
        <span className="text-xs text-stone">
          {formatSeasonMonths(food.months)}
        </span>
        <EatToggle foodId={food.id} size="card" />
      </div>
    </li>
  )
}
