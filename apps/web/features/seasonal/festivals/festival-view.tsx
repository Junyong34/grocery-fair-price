import Link from "next/link"

import { FESTIVAL_BACKGROUNDS } from "@workspace/seasonal/data/copy"
import {
  findDish,
  isDishDrawn,
  type TraditionalDish,
} from "@workspace/seasonal/data/dishes"
import { festivalOf, type Festival } from "@workspace/seasonal/data/festivals"
import { findFood, type Food } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { routes } from "@/shared/routes"

import { FoodImage } from "../components/food-image"
import { ShareButton } from "@/shared/share-button"
import { DishImage } from "./dish-image"
import { FestivalBackground } from "./festival-background"
import { CalendarLink, FestivalPeriod } from "./festival-date"
import { FESTIVAL_STYLE } from "./festival-style"

const COLLAGE_SPOTS = [
  { left: "8%", top: "14%", size: "56%", rotate: "-5deg", z: 3 },
  { left: "44%", top: "6%", size: "46%", rotate: "7deg", z: 2 },
  { left: "38%", top: "46%", size: "48%", rotate: "4deg", z: 4 },
] as const

/**
 * 1g 명절(명세 3.4).
 * 상단 히어로 카드(명절 테마 배경·워터마크·절식 콜라주)와
 * 전통 음식 카드 섹션, 그 무렵 제철 식재료 카드 섹션으로 나눠 보인다.
 */
export function FestivalView({ slug }: { slug: Festival }) {
  const festival = festivalOf(slug)
  const style = FESTIVAL_STYLE[slug]
  const foods = festival.seasonalFoodIds
    .map((id) => findFood(id))
    .filter((food): food is Food => !!food)
  const dishes = festival.traditionalDishes
    .map((id) => findDish(id))
    .filter((dish): dish is TraditionalDish => !!dish)
  const collageDishes = [
    ...dishes.filter((dish) => isDishDrawn(dish.id)),
    ...dishes.filter((dish) => !isDishDrawn(dish.id)),
  ].slice(0, 3)

  return (
    <article className="mx-auto flex max-w-[840px] flex-col gap-4 px-[18px] pt-2 pb-10 lg:gap-5 lg:px-6 lg:pt-4">
      {/* 1. 명절 히어로 카드 */}
      <Card className="relative isolate overflow-hidden border border-hairline bg-surface/90 p-5 sm:p-7">
        <span
          aria-hidden
          className="pointer-events-none absolute! inset-x-0 top-0 h-[3.5px]"
          style={{ background: style.color }}
        />
        <FestivalBackground slug={slug} />

        <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_196px] sm:gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <FestivalPeriod slug={slug} />
                <h1 className="font-heading text-[40px] leading-tight font-bold tracking-tight sm:text-[48px]">
                  {festival.name}
                </h1>
              </div>
              <ShareButton className="-mr-2 shrink-0 sm:hidden" />
            </div>

            <p className="max-w-[54ch] font-heading text-[16px] leading-relaxed text-stone sm:text-[17px]">
              {FESTIVAL_BACKGROUNDS[slug]}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 sm:flex-col sm:items-end">
            <ShareButton className="-mt-1 -mr-2 hidden shrink-0 sm:inline-flex" />
            <DishCollage dishes={collageDishes} />
          </div>
        </div>
      </Card>

      {/* 2. 전통 음식 카드 섹션 */}
      <Card
        aria-labelledby="traditional-dishes"
        className="border border-hairline bg-surface/85 p-5 sm:p-6"
      >
        <CardHeader className="mb-4 items-baseline">
          <div className="flex flex-col gap-1">
            <CardTitle id="traditional-dishes" className="text-base font-bold sm:text-lg">
              전통 음식
            </CardTitle>
            <CardDescription className="text-xs text-stone sm:text-[13px]">
              {festival.name} 상에 차려 먹는 절식
            </CardDescription>
          </div>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-stone tabular-nums">
            {dishes.length}가지
          </span>
        </CardHeader>

        <CardContent>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {dishes.map((dish) => (
              <li
                key={dish.id}
                className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas/55 px-3 py-2.5 transition-colors hover:bg-canvas"
              >
                <span className="block size-12 shrink-0">
                  <DishImage dish={dish} sizes="48px" />
                </span>
                <span className="min-w-0 text-[15px] leading-snug font-semibold text-ink">
                  {dish.name}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 3. 그 무렵 제철 식재료 카드 섹션 */}
      <Card
        aria-labelledby="seasonal-foods"
        className="border border-hairline bg-surface/85 p-5 sm:p-6"
      >
        <CardHeader className="mb-4 items-baseline">
          <div className="flex flex-col gap-1">
            <CardTitle id="seasonal-foods" className="text-base font-bold sm:text-lg">
              그 무렵 제철 식재료
            </CardTitle>
            <CardDescription className="text-xs text-stone sm:text-[13px]">
              이 시기에 실제로 맛이 오르는 제철 품종
            </CardDescription>
          </div>
          <span className="rounded-full bg-gold-wash px-2.5 py-1 text-xs font-medium text-gold-deep tabular-nums">
            {foods.length}가지
          </span>
        </CardHeader>

        <CardContent>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {foods.map((food) => (
              <li key={food.id}>
                <Link
                  href={routes.seasonal.food(food.id)}
                  scroll={false}
                  className="group flex h-full flex-col items-center gap-2 rounded-xl border border-hairline bg-canvas/45 p-3 text-center text-ink no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold-wash/65 hover:text-ink"
                >
                  <span className="block size-16 shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <FoodImage food={food} sizes="64px" showName={false} />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">
                      {food.name}{" "}
                      <span
                        aria-hidden
                        className="inline-block text-stone transition-transform group-hover:translate-x-0.5 group-hover:text-gold-deep"
                      >
                        →
                      </span>
                    </span>
                    <span className="text-xs text-stone">
                      {formatSeasonMonths(food.months)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="mt-5 border-t border-hairline pt-4">
          <CalendarLink slug={slug} />
        </CardFooter>
      </Card>
    </article>
  )
}

function DishCollage({ dishes }: { dishes: readonly TraditionalDish[] }) {
  if (dishes.length === 0) return null
  return (
    <div
      aria-hidden
      className="relative mx-auto h-[112px] w-[168px] shrink-0 sm:mx-0 sm:h-[132px] sm:w-[184px]"
    >
      {dishes.map((dish, index) => {
        const spot = COLLAGE_SPOTS[index]
        if (!spot) return null
        return (
          <span
            key={dish.id}
            className="absolute block drop-shadow-sm"
            style={{
              left: spot.left,
              top: spot.top,
              width: spot.size,
              rotate: spot.rotate,
              zIndex: spot.z,
            }}
          >
            <DishImage dish={dish} sizes="96px" preload={index === 0} />
          </span>
        )
      })}
    </div>
  )
}
