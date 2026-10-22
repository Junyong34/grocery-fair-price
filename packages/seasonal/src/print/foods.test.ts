import { describe, expect, it } from "vitest"

import { findFood, foodsInMonth, isDrawn } from "../data/foods"
import { SEASONS } from "../data/seasons"
import { MONTHS } from "../data/months"
import { monthChecklist, monthFoods, seasonFoods, startSeason, stripFoods, yearFoods } from "./foods"

describe("startSeason", () => {
  it("해를 넘는 제철은 시작하는 달의 계절이다", () => {
    expect(startSeason([1, 2, 11, 12])).toBe("autumn")
    expect(startSeason([12, 1, 2, 3, 4])).toBe("winter")
    expect(startSeason([6, 7, 8])).toBe("summer")
  })
})

describe("monthFoods", () => {
  it("그림이 있는 품종만, 상한만큼, 그 달에만 나는 품종부터 고른다", () => {
    const foods = monthFoods(10, { max: 5, categories: [] })
    expect(foods.length).toBeLessThanOrEqual(5)
    expect(foods.every((food) => isDrawn(food.id) && (food.months as readonly number[]).includes(10))).toBe(true)
    const spans = foods.map((food) => food.months.length)
    expect(spans).toEqual([...spans].sort((a, b) => a - b))
  })

  it("카테고리를 고르면 그 카테고리만 넣는다", () => {
    const foods = monthFoods(10, { max: 30, categories: ["수산"] })
    expect(foods.length).toBeGreaterThan(0)
    expect(foods.every((food) => food.category === "수산")).toBe(true)
  })
})

describe("yearFoods", () => {
  it("열두 달에서 서로 다른 품종을 한 달에 하나씩 고른다", () => {
    const foods = yearFoods({ max: 1, categories: [] })
    const ids = foods.map((food) => food.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(MONTHS.length)
  })

  it("고른 품종은 모두 그 달의 제철 품종이다", () => {
    const foods = yearFoods({ max: 1, categories: [] })
    foods.forEach((food, index) => expect(food.months as readonly number[]).toContain(MONTHS[index]))
  })
})

describe("seasonFoods", () => {
  it("한 품종은 네 계절 가운데 한 곳에만 나온다", () => {
    const ids = SEASONS.flatMap((season) => seasonFoods(season, { max: 99, categories: [] }).map((food) => food.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("11월에 시작해 2월까지 나는 굴은 가을에 들어간다", () => {
    const oyster = findFood("oyster")!
    const season = startSeason(oyster.months)
    expect(seasonFoods(season, { max: 99, categories: [] }).some((food) => food.id === "oyster")).toBe(isDrawn("oyster"))
  })
})

describe("monthChecklist", () => {
  it("그 달 품종을 그림이 없어도 모두 담는다(이름만 적는 체크 목록)", () => {
    for (const month of MONTHS) expect(monthChecklist(month, []).map((food) => food.id).sort()).toEqual(foodsInMonth(month).map((food) => food.id).sort())
    expect(MONTHS.some((month) => monthChecklist(month, []).some((food) => !isDrawn(food.id)))).toBe(true)
  })

  it("그림 칸과 같은 차례로 놓는다(그림 있는 품종만 보면 그림 칸 순서와 같다)", () => {
    const pictures = monthFoods(4, { max: 5, categories: [] })
    const list = monthChecklist(4, [])
    expect(list.filter((food) => isDrawn(food.id)).slice(0, pictures.length)).toEqual(pictures)
  })

  it("카테고리를 고르면 그 카테고리만", () => {
    const [category] = new Set(foodsInMonth(10).map((food) => food.category))
    expect(monthChecklist(10, [category!]).every((food) => food.category === category)).toBe(true)
  })
})

describe("stripFoods", () => {
  it("띠에 먼저 채우고, 남은 품종을 1일 앞·말일 뒤 빈 칸 수만큼 넣는다", () => {
    // 2027년 11월 1일은 월요일이다. 일요일 시작이면 앞 1칸, 30일 뒤 4칸이 빈다.
    const { strip, blanks, dropped } = stripFoods({ year: 2027, month: 11, weekStart: 0, stripSize: 3 })
    expect(strip).toEqual(monthFoods(11, { max: 3, categories: [] }))
    expect(blanks).toEqual(monthFoods(11, { max: Infinity, categories: [] }).slice(3, 8))
    expect(dropped).toBe(monthFoods(11, { max: Infinity, categories: [] }).length - 8)
  })

  it("2027년 모든 달·주 시작에서 띠 14개와 빈 칸이면 그림 있는 품종이 모두 들어간다", () => {
    for (const weekStart of [0, 1] as const)
      for (const month of MONTHS) expect(stripFoods({ year: 2027, month, weekStart, stripSize: 14 }).dropped, `${month}월 주 시작 ${weekStart}`).toBe(0)
  })

  it("품종이 띠보다 적으면 빈 칸에는 넣지 않는다", () => {
    const { strip, blanks } = stripFoods({ year: 2027, month: 5, weekStart: 0, stripSize: 30 })
    expect(strip).toHaveLength(monthFoods(5, { max: Infinity, categories: [] }).length)
    expect(blanks).toEqual([])
  })
})
