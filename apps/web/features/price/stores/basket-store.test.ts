import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import type { VarietySummary, VerdictKind } from "@workspace/price/types"

import { rehydrateDeviceStores } from "@/shared/device-store"

import { addToBasket, basketEntries, clearBasket, removeFromBasket } from "./basket-store"

const row = (id: string, kind: VerdictKind, surveyedOn = "2026-10-23"): VarietySummary => ({
  id,
  name: id,
  item: id,
  category: "채소",
  spec: null,
  baseUnit: "1개",
  price: 1000,
  usual: 1000,
  verdict: { kind, pct: 0 },
  surveyedOn,
  sampleSize: 45,
  stale: false,
  meetsMinN: true,
  basis: { source: "KAMIS", scope: "전국 조사 시장" },
})

describe("담은 품종", () => {
  beforeAll(() => rehydrateDeviceStores())
  beforeEach(() => clearBasket())

  it("담은 순서대로, 담을 때의 판정과 그 판정의 조사일을 남긴다", () => {
    addToBasket(row("배추", "normal", "2026-10-16"))
    addToBasket(row("대파", "pricey"))
    expect(basketEntries()).toEqual([
      { id: "배추", verdict: "normal", on: "2026-10-16" },
      { id: "대파", verdict: "pricey", on: "2026-10-23" },
    ])
  })

  it("이미 담은 품종은 다시 담지 않고 처음 담을 때 기록을 둔다", () => {
    expect(addToBasket(row("배추", "normal", "2026-10-16"))).toBe(true)
    expect(addToBasket(row("배추", "cheap"))).toBe(false)
    expect(basketEntries()).toEqual([{ id: "배추", verdict: "normal", on: "2026-10-16" }])
  })

  it("하나씩 빼거나 모두 뺀다", () => {
    addToBasket(row("배추", "normal"))
    addToBasket(row("대파", "pricey"))
    removeFromBasket("배추")
    expect(basketEntries().map((entry) => entry.id)).toEqual(["대파"])
    clearBasket()
    expect(basketEntries()).toEqual([])
  })
})
