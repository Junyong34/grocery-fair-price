import { describe, expect, it } from "vitest"

import { monthTallies, scopeFoods, seasonTallies, tally } from "./eaten-stats"
import { FOODS, foodsInMonth, foodsInSeason } from "./foods"
import { MONTHS } from "./months"
import { SEASONS } from "./seasons"
import { matchFoods } from "../search/match-foods"

// 감 9~11월, 굴 10~2월, 전어 8~10월
const eaten = new Set(["persimmon", "oyster", "gizzard-shad"])

describe("scopeFoods", () => {
  it("범위가 없으면 전체 품종", () => {
    expect(scopeFoods(null)).toBe(FOODS)
  })

  it("달이면 그 달 제철, 계절이면 그 계절 제철", () => {
    expect(scopeFoods(10)).toEqual(foodsInMonth(10))
    expect(scopeFoods("winter")).toEqual(foodsInSeason("winter"))
  })

  it("시기와 카테고리를 함께 좁히며, 요약용 시기 범위는 바꾸지 않는다", () => {
    expect(scopeFoods(11, "버섯").map((food) => food.id)).toEqual([
      "branching-mushroom",
    ])
    expect(scopeFoods(1, "버섯")).toEqual([])
    expect(
      scopeFoods("winter", "수산").some((food) => food.id === "oyster")
    ).toBe(true)
    expect(
      scopeFoods("winter", "수산").some((food) => food.id === "mandarin")
    ).toBe(false)
    expect(scopeFoods(11).some((food) => food.id === "persimmon")).toBe(true)
    expect(scopeFoods(null, "버섯")).toHaveLength(5)
  })

  it("카테고리 안에서도 별칭·초성 검색을 함께 적용한다", () => {
    expect(
      matchFoods(scopeFoods(11, "수산"), "넙치").map((food) => food.id)
    ).toEqual(["olive-flounder"])
    expect(
      matchFoods(scopeFoods(11, "수산"), "ㄱㅇ").map((food) => food.id)
    ).toContain("olive-flounder")
    expect(matchFoods(scopeFoods(11, "수산"), "감")).toEqual([])
  })
})

describe("tally", () => {
  it("품종 수와 그 가운데 먹은 수를 센다", () => {
    expect(tally(foodsInMonth(10), eaten)).toEqual({ eaten: 3, total: foodsInMonth(10).length })
    expect(tally(FOODS, new Set())).toEqual({ eaten: 0, total: FOODS.length })
  })
})

describe("monthTallies", () => {
  it("1~12월 순서로 달마다 제철 수와 먹은 수", () => {
    const tallies = monthTallies(eaten)
    expect(tallies).toHaveLength(12)
    MONTHS.forEach((month, i) => expect(tallies[i]!.total).toBe(foodsInMonth(month).length))
    expect(tallies.map((t) => t.eaten)).toEqual([1, 1, 0, 0, 0, 0, 0, 1, 2, 3, 2, 1])
  })
})

describe("seasonTallies", () => {
  it("계절마다 제철 수와 먹은 수. 한 품종이 두 계절에 걸치면 양쪽에 센다", () => {
    const tallies = seasonTallies(eaten)
    SEASONS.forEach((season) => expect(tallies[season].total).toBe(foodsInSeason(season).length))
    expect(tallies.autumn.eaten).toBe(3) // 감·전어·굴(10·11월)
    expect(tallies.winter.eaten).toBe(1) // 굴
    expect(tallies.spring.eaten).toBe(0)
  })
})
