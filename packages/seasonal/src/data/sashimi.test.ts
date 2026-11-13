import { describe, expect, it } from "vitest"

import { familiarity } from "./food-familiarity"
import { findFood, type FoodId } from "./foods"
import { MONTHS } from "./months"
import { ADDED_SASHIMI, isSashimiPick, SASHIMI_IDS, SASHIMI_MONTHS, sashimiInMonth } from "./sashimi"

// .scratch/sashimi/issues/06: 2026-11-03 제철 보정으로 달을 고친 품종(food-registry.json의 근거)
const SEASON_CORRECTED = [
  "black-scraper",
  "goby",
  "sardinella",
  "banded-grouper",
  "red-rockfish",
] as const

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

  it("출처 조사로 제철을 고친 품종은 회 화면 달이 앱 제철과 같다", () => {
    for (const id of SEASON_CORRECTED) {
      const months = MONTHS.filter((month) =>
        SASHIMI_MONTHS[month].includes(id)
      )
      expect(months, id).toEqual([...findFood(id)!.months])
    }
  })

  it("추천(첨부 달·대표 달)과 나머지 묶음 안에서는 친숙도 1→5 순서다", () => {
    for (const month of MONTHS) {
      const rank = (id: FoodId) => (!isSashimiPick(id, month) ? 2 : SASHIMI_MONTHS[month].includes(id) ? 0 : 1)
      for (const group of [0, 1, 2]) {
        const levels = sashimiInMonth(month)
          .filter((food) => rank(food.id) === group)
          .map((food) => familiarity(food.id))
        expect(levels, `${month}월`).toEqual([...levels].sort((a, b) => a - b))
      }
    }
  })

  it("그 달 목록은 회 품종 가운데 그 달이 제철이거나 추천 달인 것 전부다", () => {
    for (const month of MONTHS) {
      const expected = SASHIMI_IDS.filter((id) => (findFood(id)!.months as readonly number[]).includes(month) || SASHIMI_MONTHS[month].includes(id))
      expect(new Set(sashimiInMonth(month).map((food) => food.id)), `${month}월`).toEqual(new Set(expected))
    }
  })

  it("11월에는 정점 달이 다른 방어·광어도 나온다(제철 범위가 겹치면 그 달 회)", () => {
    const ids = sashimiInMonth(11).map((food) => food.id)
    expect(ids).toContain("yellowtail")
    expect(ids).toContain("olive-flounder")
    expect(ids).toContain("longtooth-grouper")
  })

  it("이달 추천은 친숙도 1~3 품종 가운데 그 달이 첨부 달이거나 대표 달(peak)인 것이다", () => {
    for (const month of MONTHS) {
      for (const food of sashimiInMonth(month)) {
        const expected =
          familiarity(food.id) <= 3 &&
          (SASHIMI_MONTHS[month].includes(food.id) || (food.peak as readonly number[]).includes(month))
        expect(isSashimiPick(food.id, month), `${month}월 ${food.id}`).toBe(expected)
      }
    }
  })

  it("11월 추천은 비싼 바리류가 아니라 흔히 먹는 회다", () => {
    expect(isSashimiPick("longtooth-grouper", 11)).toBe(false)
    expect(isSashimiPick("red-spotted-grouper", 11)).toBe(false)
    expect(isSashimiPick("olive-flounder", 11)).toBe(true)
    expect(isSashimiPick("yellowtail", 12)).toBe(true)
    expect(sashimiInMonth(12).slice(0, 3).map((food) => food.id)).toEqual(["yellowtail", "black-seabream", "olive-flounder"])
    const ids = sashimiInMonth(11).map((food) => food.id)
    expect(ids.indexOf("olive-flounder")).toBeLessThan(ids.indexOf("longtooth-grouper"))
  })

  it("그 달 추천 품종이 앞이고, 각 묶음 안은 친숙도 1→5, 추천은 첨부 달 품종이 대표 달 품종보다 먼저다", () => {
    expect(sashimiInMonth(2).map((food) => food.id)).toEqual([
      "olive-flounder",
      "cod",
      "red-seabream",
      "spanish-mackerel",
      "trout",
      "yellowtail",
      "bluefin-tuna",
      "halfbeak",
      "east-sea-hanchi",
      "atka-mackerel",
      "redlip-mullet",
      "banded-grouper",
    ])
  })

  it.each([
    ["bluefin-tuna", [1, 2, 12]],
    ["cuttlefish", [5]],
    ["pointhead-flounder", [5]],
    ["octopus", [7, 8, 9]],
    ["trout", [1, 2]],
    ["fat-greenling", [7]],
  ])("신규 횟감 %s는 등록된 제철 달에만 나온다", (id, expected) => {
    const listed = MONTHS.filter((month) => sashimiInMonth(month).some((food) => food.id === id))
    expect(listed).toEqual(expected)
  })

  it("1~12 밖의 달은 빈 목록이다", () => {
    expect(sashimiInMonth(0)).toEqual([])
    expect(sashimiInMonth(13)).toEqual([])
  })
})
