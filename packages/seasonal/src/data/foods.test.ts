import { describe, expect, it } from "vitest"

import { findFood, foodsInMonth, foodsInSeason, foodsInSeasonWith, seasonsOf } from "./foods"

// 예상값은 품종 원본 food-registry.json의 제철 검증 품종에서 셌다.
describe("foodsInMonth", () => {
  it("무는 가을무·겨울무가 나는 10~12월만, 열무는 7월 식재료 조사로 확인한 달을 포함한다", () => {
    for (const month of [10, 11, 12]) expect(foodsInMonth(month).map((food) => food.id)).toContain("radish")
    for (const month of [1, 2, 3]) expect(foodsInMonth(month).map((food) => food.id)).not.toContain("radish")
    expect(foodsInMonth(7).map((food) => food.id)).toContain("young-radish")
    expect(findFood("radish")?.peak).toEqual([10, 11])
    expect(findFood("young-radish")?.peak).toEqual([6, 7])
  })

  it("그 달이 제철인 품종만 고른다", () => {
    const october = foodsInMonth(10).map((food) => food.name)

    expect(october).toHaveLength(95)
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
