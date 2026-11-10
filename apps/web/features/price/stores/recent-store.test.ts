import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ProductSummary, VarietySummary } from "@workspace/price/types"

const variety = (id: string): VarietySummary => ({
  id,
  name: id,
  item: id,
  category: "채소",
  spec: null,
  baseUnit: "1개",
  price: 1000,
  usual: 1000,
  verdict: { kind: "normal", pct: 0 },
  surveyedOn: "2026-10-23",
  sampleSize: 45,
  stale: false,
  meetsMinN: true,
  basis: { source: "KAMIS", scope: "전국 조사 시장" },
})

const product = (id: string, name = id): ProductSummary => ({
  id,
  name,
  item: "라면",
  category: "라면·면",
  size: "120g×5",
  status: "active",
  surveyedOn: "2026-10-23",
  price: 4150,
  perUnit: { unit: "100g", price: 692 },
  varietyId: null,
})

describe("최근 본 시세 · 상품", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("품종과 상품을 본 순서대로 앞에 쌓고, 같은 항목을 다시 보면 맨 앞으로 옮긴다", async () => {
    const { rehydrateDeviceStores } = await import("@/shared/device-store")
    const { pickRecentItems, recentEntries, visitProduct, visitVariety } =
      await import("./recent-store")
    rehydrateDeviceStores()

    visitVariety("cabbage")
    visitProduct("1003")
    visitVariety("onion")
    visitProduct("1003")

    expect(recentEntries()).toEqual([
      { kind: "product", id: "1003" },
      { kind: "variety", id: "onion" },
      { kind: "variety", id: "cabbage" },
    ])

    const items = pickRecentItems(
      recentEntries(),
      [variety("cabbage"), variety("onion")],
      [product("1003", "신라면")]
    )
    expect(items.map((item) => (item.kind === "variety" ? item.variety.id : item.product.id))).toEqual([
      "1003",
      "onion",
      "cabbage",
    ])
  })

  it("최대 8개까지만 남긴다", async () => {
    const { rehydrateDeviceStores } = await import("@/shared/device-store")
    const { recentEntries, visitProduct, visitVariety } = await import("./recent-store")
    rehydrateDeviceStores()

    for (let i = 1; i <= 5; i++) visitVariety(`v${i}`)
    for (let i = 1; i <= 5; i++) visitProduct(`p${i}`)

    expect(recentEntries()).toHaveLength(8)
    expect(recentEntries()[0]).toEqual({ kind: "product", id: "p5" })
    expect(recentEntries()[7]).toEqual({ kind: "variety", id: "v3" })
  })

  it("version 1의 ids 배열을 품종 기록으로 옮긴다", async () => {
    const { deviceStorage, rehydrateDeviceStores } = await import("@/shared/device-store")
    deviceStorage().setItem(
      "price:recent",
      JSON.stringify({ state: { ids: ["cabbage", "onion"] }, version: 1 })
    )
    const { recentEntries } = await import("./recent-store")
    rehydrateDeviceStores()

    expect(recentEntries()).toEqual([
      { kind: "variety", id: "cabbage" },
      { kind: "variety", id: "onion" },
    ])
  })

  it("최근 본 시세를 지워도 저장된 상품 기록과 순서를 보존한다", async () => {
    const { deviceStorage, rehydrateDeviceStores } = await import("@/shared/device-store")
    const products = [
      { kind: "product", id: "1189" },
      { kind: "product", id: "1003" },
    ]
    deviceStorage().setItem(
      "price:recent",
      JSON.stringify({
        state: { entries: [products[0], { kind: "variety", id: "cabbage" }, products[1]] },
        version: 2,
      })
    )
    const { clearRecentVarieties, recentEntries } = await import("./recent-store")

    clearRecentVarieties()
    rehydrateDeviceStores()

    expect(recentEntries()).toEqual(products)
    const persisted = await deviceStorage().getItem("price:recent")
    expect(JSON.parse(persisted ?? "{}")).toMatchObject({
      state: { entries: products },
    })
  })
})
