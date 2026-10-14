import { DRAWN_FOOD_IDS } from "./drawn-foods.generated"
import { FOOD_ROWS } from "./foods.generated"
import { SEASON_MONTHS, type Season } from "./seasons"

/** 품종 하나. id는 일러스트 카탈로그와 같은 영문 kebab-case다. aliases는 검색에 쓰는 다른 이름이다. */
export type Food = (typeof FOOD_ROWS)[number]
export type FoodId = Food["id"]
export type FoodCategory = Food["category"]

/** 화면에 나오는 품종 전체(검증 품종). 이름 가나다순. */
export const FOODS: readonly Food[] = FOOD_ROWS

/** 그 달이 제철인 품종. */
export function foodsInMonth(month: number): readonly Food[] {
  return FOODS.filter((food) => (food.months as readonly number[]).includes(month))
}

/** 계절의 어느 달이라도 제철인 품종. 한 품종은 한 번만 나온다. */
export function foodsInSeason(season: Season): readonly Food[] {
  return FOODS.filter((food) => food.months.some((month) => SEASON_MONTHS[season].includes(month)))
}

/** id로 품종 찾기. 없는 id면 undefined. */
export function findFood(id: string): Food | undefined {
  return FOODS.find((food) => food.id === id)
}

const DRAWN = new Set<string>(DRAWN_FOOD_IDS)

/** 일러스트가 있는 품종인지. 없으면 화면에서 이름 카드로 대신한다. */
export function isDrawn(id: string): boolean {
  return DRAWN.has(id)
}
