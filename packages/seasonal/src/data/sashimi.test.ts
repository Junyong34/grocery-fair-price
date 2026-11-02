import { describe, expect, it } from "vitest"

import { familiarity } from "./food-familiarity"
import { findFood } from "./foods"
import { MONTHS } from "./months"
import { ADDED_SASHIMI, SASHIMI_MONTHS, sashimiInMonth } from "./sashimi"

describe("sashimi", () => {
  it("적은 id는 모두 있는 수산 품종이다", () => {
    for (const ids of Object.values(SASHIMI_MONTHS))
      for (const id of ids) expect(findFood(id)?.category, id).toBe("수산")
  })

  it("열두 달 모두 한 종 이상이고, 한 달 안에 같은 품종이 두 번 나오지 않는다", () => {
    for (const month of MONTHS) {
      const ids = SASHIMI_MONTHS[month]
      expect(ids.length, `${month}월`).toBeGreaterThan(0)
      expect(new Set(ids).size, `${month}월`).toBe(ids.length)
    }
  })

  it("첨부 48종과 추가 7종, 모두 55종이다", () => {
    const all = new Set(Object.values(SASHIMI_MONTHS).flat())
    expect(all.size).toBe(55)
    expect(ADDED_SASHIMI).toHaveLength(7)
    for (const id of ADDED_SASHIMI) expect(all.has(id), id).toBe(true)
  })

  it("추가 품종은 앱의 대표 달(peak)에만 나온다", () => {
    for (const id of ADDED_SASHIMI) {
      const months = MONTHS.filter((month) =>
        SASHIMI_MONTHS[month].includes(id)
      )
      expect(months, id).toEqual([...findFood(id)!.peak].sort((a, b) => a - b))
    }
  })

  it("한 달 안에서는 친숙도 1→3 순서다", () => {
    for (const month of MONTHS) {
      const levels = sashimiInMonth(month).map((food) => familiarity(food.id))
      expect(levels, `${month}월`).toEqual([...levels].sort((a, b) => a - b))
    }
  })

  it("같은 친숙도 안에서는 적은 순서(첨부 순서, 추가 품종은 뒤)를 지킨다", () => {
    expect(sashimiInMonth(2).map((food) => food.id)).toEqual([
      "olive-flounder",
      "cod",
      "halfbeak",
      "redlip-mullet",
      "east-sea-hanchi",
    ])
  })

  it("1~12 밖의 달은 빈 목록이다", () => {
    expect(sashimiInMonth(0)).toEqual([])
    expect(sashimiInMonth(13)).toEqual([])
  })
})
