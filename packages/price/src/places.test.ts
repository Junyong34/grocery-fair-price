import { describe, expect, it } from "vitest"

import { placesByType, sameEverywhere } from "./places"
import type { PlaceQuote } from "./types"

const place = (name: string, type: PlaceQuote["type"], price: number, samples = [price]): PlaceQuote => ({
  type,
  name,
  region: null,
  price,
  samples,
})

describe("placesByType", () => {
  it("업태별로 나누고 싼 순으로", () => {
    const places = [place("E", "large_retail", 4990), place("동문", "traditional", 7530), place("C", "large_retail", 3480), place("신정", "traditional", 4160)]
    const { large_retail, traditional } = placesByType(places)
    expect(large_retail.map((p) => p.name)).toEqual(["C", "E"])
    expect(traditional.map((p) => p.name)).toEqual(["신정", "동문"])
  })
})

describe("sameEverywhere", () => {
  it("조사 시장이 여럿이고 값이 모두 같으면 전국 같은 값", () => {
    expect(sameEverywhere(place("C", "large_retail", 3480, [3480, 3480, 3480]))).toBe(true)
    expect(sameEverywhere(place("B", "large_retail", 3900, [3100, 3900]))).toBe(false)
    expect(sameEverywhere(place("신정", "traditional", 4160))).toBe(false)
  })
})
