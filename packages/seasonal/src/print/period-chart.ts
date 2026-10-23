import type { Food, FoodCategory } from "../data/foods"
import { orderSeasonMonths } from "../data/months"
import { yearFoods } from "./foods"

// 제철 막대표: 행 = 품종, 열 = 1~12월, 제철 달에 막대. 월별 포스터 P-B, 연간 한 장 Y-C, 월간 표지 C-3이 같이 쓴다.
// 여기서는 어떤 줄을 어떤 차례로 몇 단에 놓을지만 정하고, 그리기(크기·색)는 apps/web/features/print/parts/period-chart.tsx가 한다.

/** 막대 하나. 달(1~12), 양 끝 포함. */
export type SeasonRun = { from: number; to: number }

/** 막대표 한 줄. group은 카테고리 머리 줄, food는 품종 줄이다. */
export type ChartLine = { type: "group"; category: FoodCategory } | { type: "food"; food: Food; runs: readonly SeasonRun[] }

/** 카테고리 묶음 차례. 품종이 많은 묶음부터 장보기에서 자주 보는 차례로 둔다. */
const CATEGORY_ORDER: readonly FoodCategory[] = ["채소", "버섯", "과일", "수산", "곡물·견과"]

/** 제철 달을 1월부터 이어진 막대로 묶는다. 12월에서 1월로 넘는 제철은 1월 쪽 막대와 12월 쪽 막대 둘이 된다. */
export function seasonRuns(months: readonly number[]): SeasonRun[] {
  const sorted = [...new Set(months)].sort((a, b) => a - b)
  const runs: SeasonRun[] = []
  for (const month of sorted) {
    const last = runs.at(-1)
    if (last && last.to === month - 1) last.to = month
    else runs.push({ from: month, to: month })
  }
  return runs
}

/** 막대표에 싣는 품종의 달마다 상한. 여섯이면 많아야 72줄로, 그림 있는 품종 67개를 다 싣던 때와 글자 크기가 같다. */
export const CHART_PER_MONTH = 6

/** 막대표에 실을 품종: 고른 카테고리(비우면 전부)에서 달마다 대표 CHART_PER_MONTH개(yearFoods, 앞 달과 겹치지 않음). 품종이 192개라 다 실으면 글자가 6pt 아래로 준다. */
export function chartFoods(categories: readonly FoodCategory[]): readonly Food[] {
  return yearFoods({ max: CHART_PER_MONTH, categories })
}

/** 품종을 카테고리 묶음(머리 줄 + 품종 줄)으로 늘어놓는다. 묶음 안은 제철이 시작하는 달 순, 같으면 이름순. */
export function chartLines(foods: readonly Food[]): ChartLine[] {
  const start = (food: Food) => orderSeasonMonths(food.months)[0]!
  return CATEGORY_ORDER.flatMap((category): ChartLine[] => {
    const rows = foods
      .filter((food) => food.category === category)
      .sort((a, b) => start(a) - start(b) || a.name.localeCompare(b.name, "ko"))
    if (rows.length === 0) return []
    return [{ type: "group", category }, ...rows.map((food): ChartLine => ({ type: "food", food, runs: seasonRuns(food.months) }))]
  })
}

/**
 * 줄을 columns단으로 나눈다. 단마다 줄 수를 고르게 하고, 단이 묶음 중간에서 시작하면 그 묶음 머리 줄을 다시 넣는다.
 * 머리 줄이 단 맨 끝에 홀로 남지 않게 다음 단으로 넘긴다.
 */
export function chartColumns(lines: readonly ChartLine[], columns: number): ChartLine[][] {
  const target = Math.ceil(lines.length / columns)
  const result: ChartLine[][] = [[]]
  let group: ChartLine | undefined
  for (const line of lines) {
    if (line.type === "group") group = line
    const column = result.at(-1)!
    const full = column.length >= target || (line.type === "group" && column.length >= target - 1)
    if (full && result.length < columns) result.push(line.type === "food" && group ? [group] : [])
    result.at(-1)!.push(line)
  }
  while (result.length < columns) result.push([])
  return result
}
