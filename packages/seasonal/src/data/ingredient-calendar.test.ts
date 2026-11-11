import { describe, expect, it } from "vitest"

import { FOODS } from "./foods"
import {
  INGREDIENT_CATEGORIES,
  MONTHLY_INGREDIENT_CATEGORIES,
  foodsForIngredientCalendar,
  seasonRuns,
} from "./ingredient-calendar"
import { MONTHS } from "./months"

describe("식재료별 제철", () => {
  it("각 카테고리에 속한 모든 품종을 담고 대표 품종을 앞에 둔다", () => {
    for (const category of INGREDIENT_CATEGORIES) {
      const foods = foodsForIngredientCalendar(category)
      expect(new Set(foods)).toEqual(
        new Set(FOODS.filter((food) => food.category === category))
      )
      expect(foods.map((food) => Number(food.core))).toEqual(
        foods.map((food) => Number(food.core)).sort((a, b) => b - a)
      )
    }
  })

  it("월별 화면을 여는 카테고리는 모든 달에 제철 품종이 있다", () => {
    for (const { label } of MONTHLY_INGREDIENT_CATEGORIES) {
      for (const month of MONTHS) {
        expect(
          foodsForIngredientCalendar(label).some((food) =>
            food.months.some((value) => value === month)
          )
        ).toBe(true)
      }
    }
  })
})

describe("seasonRuns", () => {
  it("이어진 달을 한 구간으로 묶는다", () => {
    expect(seasonRuns([5, 6, 7])).toEqual([{ start: 5, end: 7 }])
  })

  it("해를 넘기는 제철은 12월 끝과 1월 시작의 두 구간이 된다", () => {
    expect(seasonRuns([10, 11, 12, 1, 2, 3])).toEqual([
      { start: 1, end: 3 },
      { start: 10, end: 12 },
    ])
  })

  it("떨어진 달은 따로 묶고, 빈 목록은 빈 구간이다", () => {
    expect(seasonRuns([1, 3, 4, 9])).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 4 },
      { start: 9, end: 9 },
    ])
    expect(seasonRuns([])).toEqual([])
  })
})
