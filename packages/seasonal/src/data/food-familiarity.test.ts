import { describe, expect, it } from "vitest"

import { bestMonth, FAMILIARITY_1, FAMILIARITY_2, FAMILIARITY_4, FAMILIARITY_5, familiarity } from "./food-familiarity"
import { findFood } from "./foods"
import { MONTHS } from "./months"

const LISTED = [...Object.keys(FAMILIARITY_1), ...Object.keys(FAMILIARITY_2), ...FAMILIARITY_4, ...FAMILIARITY_5]

describe("food-familiarity", () => {
  it("적은 id는 모두 있는 품종이다", () => {
    for (const id of LISTED) expect(findFood(id), id).toBeDefined()
  })

  it("한 품종은 한 등급에만 적는다", () => {
    expect(new Set(LISTED).size).toBe(LISTED.length)
  })

  it("1·2등급의 최적 달은 그 품종의 대표 달(peak) 안이다", () => {
    for (const [id, month] of [...Object.entries(FAMILIARITY_1), ...Object.entries(FAMILIARITY_2)])
      expect(findFood(id)!.peak as readonly number[], id).toContain(month)
  })

  it("1·2등급 최적 달은 달마다 셋에서 여섯이다", () => {
    const months = [...Object.values(FAMILIARITY_1), ...Object.values(FAMILIARITY_2)]
    for (const month of MONTHS) {
      const count = months.filter((m) => m === month).length
      expect(count, `${month}월`).toBeGreaterThanOrEqual(3)
      expect(count, `${month}월`).toBeLessThanOrEqual(6)
    }
  })

  it("적지 않은 품종은 3등급, 최적 달은 계절 순서로 첫 대표 달이다", () => {
    expect(familiarity("potato")).toBe(1)
    expect(familiarity("strawberry")).toBe(1)
    expect(familiarity("shepherds-purse")).toBe(2)
    expect(familiarity("wild-chive")).toBe(3)
    expect(familiarity("maesaengi")).toBe(4)
    expect(familiarity("marbled-rockfish")).toBe(5)
    // 과메기 peak [1, 11, 12]: 해를 넘으므로 11월부터 센다.
    expect(bestMonth(findFood("gwamegi")!)).toBe(11)
    expect(bestMonth(findFood("strawberry")!)).toBe(1)
  })
})
