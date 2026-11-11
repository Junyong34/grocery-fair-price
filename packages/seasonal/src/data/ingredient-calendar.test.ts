import { describe, expect, it } from "vitest"

import { FOODS } from "./foods"
import {
  INGREDIENT_CATEGORIES,
  MONTHLY_INGREDIENT_CATEGORIES,
  foodsForIngredientCalendar,
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
