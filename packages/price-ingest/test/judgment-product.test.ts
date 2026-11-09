// 상품 payload 만들기 (catalog-scale/09). 순수 함수.
import { productDetailSchema } from "@workspace/price/schema"
import { describe, expect, it } from "vitest"

import { buildProduct, sizeOf, type ProductInput, type SummaryRow } from "../src/judgment/product.ts"

const LATEST = "2026-10-23"

const row = (scope: string, date: string, median: number, over: Partial<SummaryRow> = {}): SummaryRow => ({
  scope,
  date,
  median,
  min: median - 100,
  max: median + 100,
  stores: 10,
  promo: 0,
  ...over,
})

function input(over: Partial<ProductInput> = {}): ProductInput {
  return {
    goodId: "1522",
    name: "비비고 사골곰탕(500g)",
    status: "surveyed",
    item: "국·탕",
    category: "간편식·냉동",
    totalQty: 500,
    totalUnit: "G",
    varietyId: null,
    rows: [
      row("national", "2026-10-09", 2000),
      row("national", LATEST, 1900, { min: 1500, max: 2480, stores: 140 }),
      row("channel:ssm", LATEST, 2800, { stores: 124 }),
      row("channel:large_mart", LATEST, 1850, { stores: 12 }),
      row("seller:5", LATEST, 2800, { stores: 124 }),
      row("seller:1", LATEST, 1850.5, { min: 1751, max: 1951, stores: 7, promo: 2 }),
      row("seller:1", "2026-10-09", 1700),
    ],
    sellers: new Map([
      [1, { name: "이마트", channel: "large_mart" }],
      [5, { name: "GS더프레시", channel: "ssm" }],
    ]),
    ...over,
  }
}

describe("상품 payload", () => {
  it("최근 조사일의 전국·업태·판매처 값을 화면 모양으로 낸다", () => {
    const p = buildProduct(input(), LATEST)!
    expect(productDetailSchema.parse(p)).toEqual(p)
    expect(p).toMatchObject({
      id: "1522",
      size: "500g",
      perUnit: { unit: "100g", price: 380 },
      price: 1900,
      range: { min: 1500, max: 2480, stores: 140 },
      surveyedOn: LATEST,
      status: "active",
      basis: { source: "참가격", scope: "전국 판매점" },
    })
    // 업태·판매처는 싼 순, 지난 조사일 행은 쓰지 않는다
    expect(p.channels.map((c) => c.channel)).toEqual(["large_mart", "ssm"])
    expect(p.sellers).toEqual([
      { seller: "이마트", channel: "large_mart", price: 1851, min: 1751, max: 1951, stores: 7, promo: true },
      { seller: "GS더프레시", channel: "ssm", price: 2800, min: 2700, max: 2900, stores: 124, promo: false },
    ])
    expect(p.trend).toEqual([
      { date: "2026-10-09", median: 2000, min: 1900 },
      { date: LATEST, median: 1900, min: 1500 },
    ])
  })

  it("최근 조사에서 빠졌으면 stale, 조사를 멈췄으면 discontinued", () => {
    const old = input({ rows: [row("national", "2026-09-11", 2000)] })
    expect(buildProduct(old, LATEST)!.status).toBe("stale")
    expect(buildProduct(old, LATEST)!.surveyedOn).toBe("2026-09-11")
    expect(buildProduct(input({ status: "not_surveyed" }), LATEST)!.status).toBe("discontinued")
  })

  it("바로 전 조사일까지는 active다 (2주 조사 한 번 빠짐)", () => {
    expect(buildProduct(input({ rows: [row("national", "2026-10-09", 2000)] }), LATEST)!.status).toBe("active")
  })

  it("전국 요약이 없거나 합쳐진 상품은 내지 않는다", () => {
    expect(buildProduct(input({ rows: [row("seller:1", LATEST, 1800)] }), LATEST)).toBeNull()
    expect(buildProduct(input({ status: "merged" }), LATEST)).toBeNull()
  })

  it("추이는 최근 조사일 12개까지", () => {
    const rows = Array.from({ length: 15 }, (_, i) => row("national", `2026-0${1 + Math.floor(i / 2)}-${i % 2 ? "20" : "05"}`, 1000 + i))
    expect(buildProduct(input({ rows }), LATEST)!.trend).toHaveLength(12)
  })

  it("기준 단위당 가격은 g·ml·여러 개 묶음만", () => {
    expect(buildProduct(input({ totalQty: 1500, totalUnit: "ML" }), LATEST)!.perUnit).toEqual({ unit: "100ml", price: 127 })
    expect(buildProduct(input({ totalQty: 10, totalUnit: "EA" }), LATEST)!.perUnit).toEqual({ unit: "1개", price: 190 })
    expect(buildProduct(input({ totalQty: 1, totalUnit: "EA" }), LATEST)!.perUnit).toBeNull()
    expect(buildProduct(input({ totalQty: 1, totalUnit: "MR" }), LATEST)!.perUnit).toBeNull()
  })
})

describe("용량 표시", () => {
  it("단위를 읽기 쉽게 바꾼다", () => {
    expect(sizeOf(500, "G")).toBe("500g")
    expect(sizeOf(1000, "G")).toBe("1kg")
    expect(sizeOf(2500, "G")).toBe("2.5kg")
    expect(sizeOf(1500, "ML")).toBe("1.5L")
    expect(sizeOf(250, "ML")).toBe("250ml")
    expect(sizeOf(30, "EA")).toBe("30개")
    expect(sizeOf(1, "PK")).toBeNull()
    expect(sizeOf(null, null)).toBeNull()
  })
})
