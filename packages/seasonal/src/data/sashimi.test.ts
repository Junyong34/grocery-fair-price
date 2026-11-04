import { describe, expect, it } from "vitest"

import { familiarity } from "./food-familiarity"
import { findFood } from "./foods"
import { MONTHS } from "./months"
import { ADDED_SASHIMI, isSashimiPick, SASHIMI_IDS, SASHIMI_MONTHS, sashimiInMonth } from "./sashimi"

// .scratch/sashimi/issues/06: food-season-corrections.json에 2026-11-03 더한 품종
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

  it("추천 품종 묶음과 나머지 묶음 안에서는 친숙도 1→3 순서다", () => {
    for (const month of MONTHS) {
      for (const pick of [true, false]) {
        const levels = sashimiInMonth(month)
          .filter((food) => isSashimiPick(food.id, month) === pick)
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

  it("추천 달 표시는 첨부·대표 달(SASHIMI_MONTHS)에만 붙는다", () => {
    expect(isSashimiPick("longtooth-grouper", 11)).toBe(true)
    expect(isSashimiPick("yellowtail", 11)).toBe(false)
    expect(isSashimiPick("yellowtail", 12)).toBe(true)
  })

  it("그 달 추천 품종이 앞이고, 각 묶음 안은 친숙도 1→3, 같은 등급은 적은 순서다", () => {
    expect(sashimiInMonth(2).map((food) => food.id)).toEqual([
      "olive-flounder",
      "cod",
      "halfbeak",
      "redlip-mullet",
      "banded-grouper",
      "east-sea-hanchi",
      "red-seabream",
      "spanish-mackerel",
      "atka-mackerel",
      "yellowtail",
    ])
  })

  it("1~12 밖의 달은 빈 목록이다", () => {
    expect(sashimiInMonth(0)).toEqual([])
    expect(sashimiInMonth(13)).toEqual([])
  })
})
