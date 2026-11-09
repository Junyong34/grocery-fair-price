import { describe, expect, it } from "vitest"

import { pageStateOf, summarizeProducts, type ProductRow } from "./product-view"

const row = (over: Partial<ProductRow>): ProductRow => ({
  goodId: "1520",
  name: "1등급 다향 훈제오리(500g)",
  status: "surveyed",
  category: "햄·어묵·두부",
  item: "훈제오리",
  itemSet: true,
  link: { kind: "ignored" },
  page: { status: "active", price: 19990, perUnit: "100g당 3,998원", surveyedOn: "2026-10-23" },
  ...over,
})

describe("상품 화면 상태", () => {
  it("조사 중단 → 페이지 없음 → 오래됨 → 노출 순으로 가른다", () => {
    expect(pageStateOf(row({ status: "not_surveyed" }))).toBe("discontinued")
    expect(pageStateOf(row({ page: null }))).toBe("no-page")
    expect(pageStateOf(row({ page: { status: "stale", price: 1000, perUnit: null, surveyedOn: "2026-09-11" } }))).toBe("stale")
    expect(pageStateOf(row({}))).toBe("shown")
  })

  it("상태별 수와 품목을 정하지 않은 상품 수를 센다", () => {
    const rows = [row({}), row({ goodId: "b", page: null }), row({ goodId: "c", itemSet: false }), row({ goodId: "d", status: "not_surveyed" })]
    expect(summarizeProducts(rows)).toEqual({ total: 4, shown: 2, stale: 0, noPage: 1, discontinued: 1, noItem: 1 })
  })
})
