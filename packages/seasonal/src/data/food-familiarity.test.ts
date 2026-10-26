import { describe, expect, it } from "vitest"

import { bestMonth, COMMON_FOODS, familiarity, RARE_FOODS } from "./food-familiarity"
import { findFood } from "./foods"

describe("food-familiarity", () => {
  it("적은 id는 모두 있는 품종이다", () => {
    for (const id of [...Object.keys(COMMON_FOODS), ...RARE_FOODS]) expect(findFood(id), id).toBeDefined()
  })

  it("1등급의 최적 달은 그 품종의 대표 달(peak) 안이다", () => {
    for (const [id, month] of Object.entries(COMMON_FOODS)) expect(findFood(id)!.peak as readonly number[], id).toContain(month)
  })

  it("1등급과 3등급이 겹치지 않는다", () => {
    expect(Object.keys(COMMON_FOODS).filter((id) => RARE_FOODS.has(id))).toEqual([])
  })

  it("적지 않은 품종은 2등급, 최적 달은 계절 순서로 첫 대표 달이다", () => {
    expect(familiarity("shepherds-purse")).toBe(2)
    expect(familiarity("strawberry")).toBe(1)
    expect(familiarity("maesaengi")).toBe(3)
    // 과메기 peak [1, 11, 12]: 해를 넘으므로 11월부터 센다.
    expect(bestMonth(findFood("gwamegi")!)).toBe(11)
    expect(bestMonth(findFood("strawberry")!)).toBe(1)
  })
})
