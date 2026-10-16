import { FOODS, isDrawn, type Food, type FoodCategory } from "../data/foods"
import { orderSeasonMonths } from "../data/months"
import { seasonOfMonth, type Season } from "../data/seasons"

// 인쇄물 칸(달·계절)에 넣을 품종 고르기. 인쇄물에는 그림이 있는 품종만 넣는다(이름 카드는 종이에서 빈 원으로 보인다).

export type FoodPick = { max: number; categories: readonly FoodCategory[] }

const pickable = ({ categories }: FoodPick) => (food: Food) =>
  isDrawn(food.id) && (categories.length === 0 || categories.includes(food.category))

/** 그 달 품종. 그 달에 더 특별한(제철이 짧은) 품종부터, 같으면 이름순. */
export function monthFoods(month: number, pick: FoodPick): readonly Food[] {
  return FOODS.filter((food) => (food.months as readonly number[]).includes(month) && pickable(pick)(food))
    .sort((a, b) => a.months.length - b.months.length || a.name.localeCompare(b.name, "ko"))
    .slice(0, pick.max)
}

/** 제철이 시작하는 달의 계절. 여러 계절에 걸친 품종을 포스터의 한 계절에만 놓을 때 쓴다. */
export function startSeason(months: readonly number[]): Season {
  return seasonOfMonth(orderSeasonMonths(months)[0]!)
}

/** 그 계절에 제철이 시작하는 품종. 시작 달 순서, 같으면 이름순. */
export function seasonFoods(season: Season, pick: FoodPick): readonly Food[] {
  const start = (food: Food) => orderSeasonMonths(food.months)[0]!
  const order = (month: number) => (month - (season === "winter" ? 12 : 0) + 12) % 12
  return FOODS.filter((food) => startSeason(food.months) === season && pickable(pick)(food))
    .sort((a, b) => order(start(a)) - order(start(b)) || a.name.localeCompare(b.name, "ko"))
    .slice(0, pick.max)
}
