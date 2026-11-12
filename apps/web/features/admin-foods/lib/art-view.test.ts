import { describe, expect, it } from "vitest"

import type { FoodEntry } from "@workspace/seasonal/data/food-registry"

import { artUses, filterArts, isShown, type ArtRow } from "./art-view"

const food = (over: Partial<FoodEntry>): FoodEntry => ({
  name: "무",
  aliases: [],
  category: "채소",
  months: [10],
  peak: [10],
  season: "verified",
  basis: "survey",
  evidence: { sources: [] },
  ...over,
})
const NONE = { seasonal: [], infant: [] }
const row = (over: Partial<ArtRow>): ArtRow => ({ id: "radish", name: "무", review: "reviewed", references: [], uses: NONE, ...over })

describe("artUses", () => {
  it("품종은 art가 없으면 품종 ID의 그림을, 있으면 그 그림을 쓴다", () => {
    const uses = artUses({ shrimp: food({ name: "대하" }), "shrimp-kinds": food({ name: "새우류", season: "unverified", art: "shrimp" }) }, { fruits: {}, pairings: {} })

    expect(uses.get("shrimp")?.seasonal).toEqual([
      { id: "shrimp", name: "대하", verified: true },
      { id: "shrimp-kinds", name: "새우류", verified: false },
    ])
    expect(uses.has("shrimp-kinds")).toBe(false)
  })

  it("이유식은 과일 도감과 궁합 재료를 한 목록으로 모으고 겹치면 한 번만 적는다", () => {
    const uses = artUses({}, { fruits: { mango: "mango", peanut: "peanut" }, pairings: { 땅콩: "peanut", 참개: "sesame-seed", 참깨: "sesame-seed" } })

    expect(uses.get("mango")?.infant).toEqual([{ kind: "fruits", key: "mango" }])
    expect(uses.get("peanut")?.infant).toEqual([
      { kind: "fruits", key: "peanut" },
      { kind: "pairings", key: "땅콩" },
    ])
    expect(uses.get("sesame-seed")?.infant.map((use) => use.key)).toEqual(["참개", "참깨"])
  })
})

describe("isShown", () => {
  it("제철 검증 품종이나 이유식이 쓰는 그림만 화면에 나온다", () => {
    expect(isShown({ seasonal: [{ id: "radish", name: "무", verified: true }], infant: [] })).toBe(true)
    expect(isShown({ seasonal: [], infant: [{ kind: "pairings", key: "두부" }] })).toBe(true)
    expect(isShown({ seasonal: [{ id: "lemon", name: "레몬", verified: false }], infant: [] })).toBe(false)
    expect(isShown(NONE)).toBe(false)
  })
})

describe("filterArts", () => {
  const rows = [
    row({ id: "radish", name: "무" }),
    row({ id: "lemon", name: "레몬", review: "unreviewed" }),
    row({ id: "aloe", name: "알로에", review: "unreviewed" }),
  ]

  it("미검수 그림을 앞에, 같은 상태 안에서는 이름 가나다순으로 둔다", () => {
    expect(filterArts(rows, "all", "").map((art) => art.id)).toEqual(["lemon", "aloe", "radish"])
  })

  it("상태로 거른다", () => {
    expect(filterArts(rows, "unreviewed", "").map((art) => art.id)).toEqual(["lemon", "aloe"])
    expect(filterArts(rows, "reviewed", "").map((art) => art.id)).toEqual(["radish"])
  })

  it("이름이나 그림 ID의 일부로 찾는다", () => {
    expect(filterArts(rows, "all", "레몬").map((art) => art.id)).toEqual(["lemon"])
    expect(filterArts(rows, "all", " ALO ").map((art) => art.id)).toEqual(["aloe"])
  })
})
