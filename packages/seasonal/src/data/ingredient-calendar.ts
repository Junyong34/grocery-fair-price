import { FOODS, type FoodCategory } from "./foods"

export const MONTHLY_INGREDIENT_CATEGORIES = [
  { slug: "fruit", label: "과일", title: "제철 과일" },
  { slug: "vegetables", label: "채소", title: "제철 채소" },
  { slug: "seafood", label: "수산", title: "제철 수산물" },
] as const satisfies readonly {
  slug: string
  label: FoodCategory
  title: string
}[]

export const INGREDIENT_CATEGORIES = [
  ...MONTHLY_INGREDIENT_CATEGORIES.map(({ label }) => label),
  "버섯",
  "곡물·견과",
] as const satisfies readonly FoodCategory[]

/** 데이터의 가나다순 안에서 대표 품종을 먼저 보여 준다. */
export function foodsForIngredientCalendar(category: FoodCategory) {
  return FOODS.filter((food) => food.category === category).sort(
    (a, b) => Number(b.core) - Number(a.core)
  )
}
