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

/**
 * 제철 달을 1~12월 안의 이어진 구간으로 묶는다. 달력 막대를 구간마다 하나씩 그린다.
 * 해를 넘기는 제철(10~3월)은 1월에서 시작하는 구간과 12월에서 끝나는 구간 둘이 된다.
 */
export function seasonRuns(months: readonly number[]) {
  const runs: { start: number; end: number }[] = []
  for (const month of [...new Set(months)].sort((a, b) => a - b)) {
    const last = runs.at(-1)
    if (last && last.end === month - 1) last.end = month
    else runs.push({ start: month, end: month })
  }
  return runs
}
