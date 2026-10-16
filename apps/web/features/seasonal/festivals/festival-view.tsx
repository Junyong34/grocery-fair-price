import Link from "next/link"
import { Soup } from "lucide-react"

import { FESTIVAL_BACKGROUNDS } from "@workspace/seasonal/data/copy"
import { FESTIVALS, type Festival } from "@workspace/seasonal/data/festivals"
import { findFood, type Food } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"

import { routes } from "@/shared/routes"

import { FoodImage } from "../components/food-image"
import { ShareButton } from "../components/share-button"
import { CalendarLink, FestivalPeriod } from "./festival-date"

/**
 * 1g 명절(명세 3.4). 전통 음식(차려 먹는 것, 실선)과 그 무렵 제철 품종(실제로 나는 것, 점선)을 나눠 보인다.
 * 전통 음식은 품종이 아니라 상세로 가지 않는다. 모바일·데스크톱 모두 가운데 한 열(최대 720).
 */
export function FestivalView({ slug }: { slug: Festival }) {
  const festival = FESTIVALS.find((candidate) => candidate.slug === slug)!
  const foods = festival.seasonalFoodIds
    .map((id) => findFood(id))
    .filter((food): food is Food => !!food)

  return (
    <article className="mx-auto flex max-w-[720px] flex-col gap-6 px-[18px] pt-4 pb-8 lg:pt-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-[46px] leading-tight font-bold">
            {festival.name}
          </h1>
          <ShareButton className="-mr-2.5 shrink-0" />
        </div>
        <FestivalPeriod slug={slug} />
      </header>

      <p className="border-y border-hairline py-4 font-heading text-base leading-relaxed text-stone">
        {FESTIVAL_BACKGROUNDS[slug]}
      </p>

      <section
        aria-labelledby="traditional-dishes"
        className="flex flex-col gap-3"
      >
        <h2 id="traditional-dishes" className="text-sm font-semibold">
          전통 음식{" "}
          <span className="font-normal text-stone">— 차려 먹는 것</span>
        </h2>
        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {festival.traditionalDishes.map((dish) => (
            <li
              key={dish}
              className="flex items-center gap-3 rounded-md border-[1.5px] border-ink px-3 py-2.5"
            >
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-stone"
              >
                <Soup size={20} strokeWidth={1.6} />
              </span>
              <span className="text-[15px] font-semibold">{dish}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="seasonal-foods" className="flex flex-col gap-3">
        <h2 id="seasonal-foods" className="text-sm font-semibold">
          그 무렵 제철 식재료{" "}
          <span className="font-normal text-stone">— 실제로 나는 것</span>
        </h2>
        <ul className="flex flex-wrap gap-2.5">
          {foods.map((food) => (
            <li key={food.id}>
              <Link
                href={routes.seasonal.food(food.id)}
                className="flex items-center gap-2.5 rounded-md border-[1.5px] border-dashed border-gold py-2 pr-3.5 pl-2 text-ink no-underline hover:bg-gold-wash hover:text-ink"
              >
                <span className="block size-10 shrink-0">
                  <FoodImage food={food} sizes="40px" showName={false} />
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">
                    {food.name} →
                  </span>
                  <span className="text-xs text-stone">
                    {formatSeasonMonths(food.months)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-3 w-5 rounded-[3px] border-[1.5px] border-ink"
          />
          실선 = 전통 음식
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-3 w-5 rounded-[3px] border-[1.5px] border-dashed border-gold"
          />
          점선 = 제철 식재료
        </span>
      </p>

      <CalendarLink slug={slug} />
    </article>
  )
}
