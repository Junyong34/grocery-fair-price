import { describe, expect, it } from "vitest"

import { findFood, isDrawn } from "../data/foods"
import { orderSeasonMonths } from "../data/months"
import { CHART_PER_MONTH, chartColumns, chartFoods, chartLines, seasonRuns, type ChartLine } from "./period-chart"

const foodLines = (lines: readonly ChartLine[]) => lines.filter((line) => line.type === "food")

describe("seasonRuns", () => {
  it("이어진 달을 막대 하나로 묶는다", () => {
    expect(seasonRuns([3, 4, 5])).toEqual([{ from: 3, to: 5 }])
  })

  it("12월에서 1월로 넘는 제철은 앞뒤 막대 둘이다(1월 쪽이 먼저)", () => {
    expect(seasonRuns([11, 12, 1, 2])).toEqual([
      { from: 1, to: 2 },
      { from: 11, to: 12 },
    ])
  })

  it("끊긴 제철은 막대가 여럿이고, 열두 달 내내면 하나다", () => {
    expect(seasonRuns([1, 2, 6, 7])).toEqual([
      { from: 1, to: 2 },
      { from: 6, to: 7 },
    ])
    expect(seasonRuns([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toEqual([{ from: 1, to: 12 }])
  })
})

describe("chartLines", () => {
  const lines = chartLines(chartFoods([]))

  it("달마다 대표 CHART_PER_MONTH개를 한 번씩 싣는다(그림 있는 품종만)", () => {
    const ids = foodLines(lines).map((line) => line.food.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every(isDrawn)).toBe(true)
    expect(ids.length).toBe(chartFoods([]).length)
    expect(ids.length).toBeLessThanOrEqual(CHART_PER_MONTH * 12)
  })

  it("카테고리 머리 줄 아래에 그 카테고리 품종만, 제철 시작 달 순으로 놓는다", () => {
    let category: string | undefined
    let lastStart = 0
    for (const line of lines) {
      if (line.type === "group") {
        category = line.category
        lastStart = 0
        continue
      }
      expect(line.food.category).toBe(category)
      const start = orderSeasonMonths(line.food.months)[0]!
      expect(start).toBeGreaterThanOrEqual(lastStart)
      lastStart = start
    }
  })

  it("고른 카테고리만 싣는다", () => {
    const fruit = chartLines(chartFoods(["과일"]))
    expect(fruit.filter((line) => line.type === "group")).toEqual([{ type: "group", category: "과일" }])
    expect(foodLines(fruit).every((line) => line.food.category === "과일")).toBe(true)
  })

  it("굴(11~2월)은 막대 둘이고 11월 시작으로 친다", () => {
    const oyster = foodLines(lines).find((line) => line.food.id === "oyster")!
    expect(oyster.runs).toEqual(seasonRuns(findFood("oyster")!.months))
  })
})

describe("chartColumns", () => {
  const lines = chartLines(chartFoods([]))

  it.each([1, 2, 3])("%i단으로 나눠도 품종 줄은 차례대로 한 번씩 나온다", (columns) => {
    const split = chartColumns(lines, columns)
    expect(split).toHaveLength(columns)
    expect(split.flatMap(foodLines)).toEqual(foodLines(lines))
  })

  it("단이 묶음 중간에서 시작하면 그 묶음 머리 줄을 다시 둔다", () => {
    for (const column of chartColumns(lines, 3)) expect(column[0]!.type).toBe("group")
  })

  it("단마다 줄 수 차이가 머리 줄 하나 반 안쪽이다", () => {
    const sizes = chartColumns(lines, 2).map((column) => column.length)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(2)
  })
})
