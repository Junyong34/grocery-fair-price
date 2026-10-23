import { describe, expect, it } from "vitest"

import { monthTallies, scopeFoods, seasonTallies, tally } from "./eaten-stats"
import { FOODS, foodsInMonth, foodsInSeason } from "./foods"
import { MONTHS } from "./months"
import { SEASONS } from "./seasons"

// 감 9~11월, 굴 12·1월, 전어 8~10월
const eaten = new Set(["persimmon", "oyster", "gizzard-shad"])

describe("scopeFoods", () => {
  it("범위가 없으면 전체 품종", () => {
    expect(scopeFoods(null)).toBe(FOODS)
  })

  it("달이면 그 달 제철, 계절이면 그 계절 제철", () => {
    expect(scopeFoods(10)).toEqual(foodsInMonth(10))
    expect(scopeFoods("winter")).toEqual(foodsInSeason("winter"))
  })
})

describe("tally", () => {
  it("품종 수와 그 가운데 먹은 수를 센다", () => {
    expect(tally(foodsInMonth(10), eaten)).toEqual({ eaten: 2, total: foodsInMonth(10).length })
    expect(tally(FOODS, new Set())).toEqual({ eaten: 0, total: FOODS.length })
  })
})

describe("monthTallies", () => {
  it("1~12월 순서로 달마다 제철 수와 먹은 수", () => {
    const tallies = monthTallies(eaten)
    expect(tallies).toHaveLength(12)
    MONTHS.forEach((month, i) => expect(tallies[i]!.total).toBe(foodsInMonth(month).length))
    expect(tallies.map((t) => t.eaten)).toEqual([1, 0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 1])
  })
})

describe("seasonTallies", () => {
  it("계절마다 제철 수와 먹은 수. 한 품종이 두 계절에 걸치면 양쪽에 센다", () => {
    const tallies = seasonTallies(eaten)
    SEASONS.forEach((season) => expect(tallies[season].total).toBe(foodsInSeason(season).length))
    expect(tallies.autumn.eaten).toBe(2) // 감·전어
    expect(tallies.winter.eaten).toBe(1) // 굴
    expect(tallies.spring.eaten).toBe(0)
  })
})
