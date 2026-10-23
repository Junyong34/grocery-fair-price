import { describe, expect, it } from "vitest"

import { findFood, foodsInMonth, foodsInSeason, foodsInSeasonWith, isDrawn, monthHighlights, seasonHighlights, seasonsOf } from "./foods"

// 예상값은 prototypes/seasonal-food/docs/seasonal-lists/foods.json(검증 품종)에서 셌다.
describe("foodsInMonth", () => {
  it("그 달이 제철인 품종만 고른다", () => {
    const october = foodsInMonth(10).map((food) => food.name)

    expect(october).toHaveLength(78)
    expect(october).toContain("전어")
    expect(october).toContain("사과")
    expect(october).not.toContain("수박")
  })
})

describe("foodsInSeason", () => {
  it("겨울은 12·1·2월 품종을 한 번씩만 담는다", () => {
    const winter = foodsInSeason("winter").map((food) => food.name)

    expect(winter.filter((name) => name === "시금치")).toHaveLength(1)
    expect(winter).toContain("매생이") // 1월만
    expect(winter).toContain("홍합") // 2·3월
    expect(winter).toContain("배추") // 11·12월
    expect(winter).not.toContain("사과") // 7~11월
  })
})

describe("foodsInSeasonWith", () => {
  it("제철 달이 겹치는 다른 품종을, 겹치는 달이 많은 것부터 돌려준다", () => {
    // 전어(8~10월): 세 달이 모두 겹치는 밤(8~10월)이 9·10월만 겹치는 감(9~11월)보다, 감이 8월만 겹치는 수박(6~8월)보다 앞이다.
    const names = foodsInSeasonWith(findFood("gizzard-shad")!).map((food) => food.name)

    expect(names).not.toContain("전어")
    expect(names.indexOf("밤")).toBeLessThan(names.indexOf("감"))
    expect(names.indexOf("감")).toBeLessThan(names.indexOf("수박"))
    expect(names).not.toContain("딸기")
  })
})

describe("seasonsOf", () => {
  it("제철 달이 걸치는 계절을 봄부터 차례로 돌려준다", () => {
    // 사과는 7~11월이다.
    expect(seasonsOf(findFood("apple")!)).toEqual(["summer", "autumn"])
    for (const food of foodsInMonth(12)) expect(seasonsOf(food)).toContain("winter")
  })
})

describe("monthHighlights", () => {
  it("그 달 품종 가운데 그림 있는 것, 그 달이 대표 달(peak)인 것, 처음부터 검증한 것(core), 제철이 짧은 것 순으로 고른다", () => {
    const all = monthHighlights(10, foodsInMonth(10).length)
    expect(all).toHaveLength(foodsInMonth(10).length)
    const keys = all.map((food) => [Number(!isDrawn(food.id)), Number(!(food.peak as readonly number[]).includes(10)), Number(!food.core), food.months.length])
    expect(keys).toEqual([...keys].sort((a, b) => a[0]! - b[0]! || a[1]! - b[1]! || a[2]! - b[2]! || a[3]! - b[3]!))
    // 10월 대표 20개 안에 사과·고등어·전어·감이 든다(정보누리에서 올린 품종보다 앞).
    expect(monthHighlights(10, 20).map((food) => food.name)).toEqual(expect.arrayContaining(["사과", "고등어", "전어", "감"]))
    // 사과는 10월이 시장 범위(7~11월)이자 대표 달(9~11월)이라, 대표 달이 아닌 감자(대표 6월)보다 앞이다.
    const names = all.map((food) => food.name)
    expect(names.indexOf("사과")).toBeLessThan(names.indexOf("감자"))
    expect(monthHighlights(10, 3)).toHaveLength(3)
  })
})

describe("seasonHighlights", () => {
  it("계절 대표 품종은 그림이 있는 것을 먼저, 그 계절에 대표 달(peak)이 많은 것, 오래 나는 것부터 고른다", () => {
    const autumn = seasonHighlights("autumn", 4)

    expect(autumn).toHaveLength(4)
    // 사과(대표 9~11월)와 고등어(대표 9~11월)는 가을 세 달 모두가 대표 달이고 그림도 있다.
    expect(autumn.map((food) => food.name)).toEqual(expect.arrayContaining(["사과", "고등어"]))
    expect(autumn.every((food) => foodsInSeason("autumn").includes(food))).toBe(true)
    // 그림 있는 품종이 그림 없는 품종보다 먼저다. 일러스트가 늘어도 깨지지 않게 품종 이름 대신 순서로 확인한다.
    const summer = seasonHighlights("summer", foodsInSeason("summer").length).map((food) => isDrawn(food.id))
    expect(summer).toEqual([...summer].sort((a, b) => Number(b) - Number(a)))
  })
})
