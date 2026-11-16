import { DRAWN_FOOD_IDS } from "./drawn-foods.generated"
import { FOOD_ROWS } from "./foods.generated"
import { SEASON_MONTHS, SEASONS, type Season } from "./seasons"

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

/** 제철 달이 하나라도 겹치는 다른 품종. 겹치는 달이 많은 것부터, 같으면 이름순. */
export function foodsInSeasonWith(food: Food): readonly Food[] {
  const overlap = (other: Food) => other.months.filter((month) => (food.months as readonly number[]).includes(month)).length
  return FOODS.filter((other) => other.id !== food.id && overlap(other) > 0)
    .map((other) => ({ other, shared: overlap(other) }))
    .sort((a, b) => b.shared - a.shared)
    .map(({ other }) => other)
}

/** 품종이 제철인 계절. 제철 달이 하나라도 걸치면 그 계절이다. 봄·여름·가을·겨울 순. */
export function seasonsOf(food: Food): readonly Season[] {
  return SEASONS.filter((season) => food.months.some((month) => SEASON_MONTHS[season].includes(month)))
}

// 대표 품종 고르기(이달 판, 계절 카드, 검색 설명, 인쇄물 칸)는 featured-foods.ts에 모았다.

/** 그 달이 품종의 대표 달(peak)인지. months는 시장에 많이 나오는 범위이고, peak는 그 안에서 조사가 대표로 고른 달이다. */
export const isPeak = (food: Food, month: number): boolean => (food.peak as readonly number[]).includes(month)
