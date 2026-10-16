import { FOODS, foodsInMonth, foodsInSeason, type Food } from "./foods"
import { MONTHS, type Month } from "./months"
import { SEASONS, type Season } from "./seasons"

/** 1h에서 보고 있는 범위. null이면 전체, 숫자면 그 달, 문자열이면 그 계절. */
export type Scope = Month | Season | null

/** 범위 안의 품종 수(total)와 그 가운데 먹은 수(eaten). */
export type Tally = { eaten: number; total: number }

/** 범위에 드는 품종. 전체면 FOODS 그대로다. */
export function scopeFoods(scope: Scope): readonly Food[] {
  if (scope === null) return FOODS
  return typeof scope === "number" ? foodsInMonth(scope) : foodsInSeason(scope)
}

export function tally(foods: readonly Food[], eaten: ReadonlySet<string>): Tally {
  return { eaten: foods.filter((food) => eaten.has(food.id)).length, total: foods.length }
}

/** 1~12월 순서의 달별 집계. */
export function monthTallies(eaten: ReadonlySet<string>): Tally[] {
  return MONTHS.map((month) => tally(foodsInMonth(month), eaten))
}

/** 계절별 집계. 여러 계절에 걸친 품종은 계절마다 센다. */
export function seasonTallies(eaten: ReadonlySet<string>): Record<Season, Tally> {
  return Object.fromEntries(SEASONS.map((season) => [season, tally(foodsInSeason(season), eaten)])) as Record<Season, Tally>
}
