import { describe, expect, it } from "vitest"

import { findFood, foodsInMonth, foodsInSeason, foodsInSeasonWith } from "./foods"

// 예상값은 prototypes/seasonal-food/docs/seasonal-lists/foods.json(검증 품종)에서 셌다.
describe("foodsInMonth", () => {
  it("그 달이 제철인 품종만 고른다", () => {
    const october = foodsInMonth(10).map((food) => food.name)

    expect(october).toHaveLength(17)
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
    expect(winter).toContain("홍합") // 2월만
    expect(winter).toContain("배추") // 11·12월
    expect(winter).not.toContain("사과") // 9~11월
  })
})

describe("foodsInSeasonWith", () => {
  it("제철 달이 겹치는 다른 품종을, 겹치는 달이 많은 것부터 돌려준다", () => {
    // 전어(9·10월): 9·10월이 모두 겹치는 고구마·배·밤이 10월만 겹치는 감보다 앞이다.
    const names = foodsInSeasonWith(findFood("gizzard-shad")!).map((food) => food.name)

    expect(names).not.toContain("전어")
    expect(names).toContain("감")
    expect(names).not.toContain("수박")
    expect(names.indexOf("고구마")).toBeLessThan(names.indexOf("감"))
  })
})
