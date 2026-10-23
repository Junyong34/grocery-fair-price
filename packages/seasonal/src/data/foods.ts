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

// 대표 품종 고르기 규칙은 쓰는 곳마다 조금씩 다르다. 화면·검색 설명용은 여기, 인쇄물용(그림 있는 품종만)은 print/foods.ts에 있다.

/** 그 달이 품종의 대표 달(peak)인지. months는 시장에 많이 나오는 범위이고, peak는 그 안에서 조사가 대표로 고른 달이다. */
const isPeak = (food: Food, month: number) => (food.peak as readonly number[]).includes(month)

/**
 * 그 달을 대표하는 품종(2a 흩뿌리기 판, 검색 설명). 그림이 있는 것, 그 달이 대표 달인 것, 처음부터 검증한 품종(core), 그 달에만 가까운(제철 달이 적은) 것, 이름 순.
 * 그 달 제철 품종이 많아(최대 78) 판에는 앞에서 몇 개만 그리고 나머지는 이름 목록으로 둔다.
 */
export function monthHighlights(month: number, count: number): readonly Food[] {
  return [...foodsInMonth(month)]
    .sort(
      (a, b) =>
        Number(isDrawn(b.id)) - Number(isDrawn(a.id)) ||
        Number(isPeak(b, month)) - Number(isPeak(a, month)) ||
        Number(b.core) - Number(a.core) ||
        a.months.length - b.months.length ||
        a.name.localeCompare(b.name, "ko"),
    )
    .slice(0, count)
}

/**
 * 계절 대표 품종(3a 계절 카드). 카드에 크게 그리므로 그림이 있는 품종을 먼저, 그 안에서는 그 계절에 대표 달(peak)이 많은 품종, 제철인 달이 많은 품종부터 고른다.
 * 그림이 모자라면 그림 없는 품종으로 채운다. 그림 목록이 늘면 결과도 바뀐다.
 */
export function seasonHighlights(season: Season, count: number): readonly Food[] {
  const monthsIn = (months: readonly number[]) => months.filter((month) => SEASON_MONTHS[season].includes(month)).length
  return [...foodsInSeason(season)]
    .sort((a, b) => Number(isDrawn(b.id)) - Number(isDrawn(a.id)) || monthsIn(b.peak) - monthsIn(a.peak) || monthsIn(b.months) - monthsIn(a.months))
    .slice(0, count)
}
