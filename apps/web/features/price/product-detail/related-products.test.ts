import { describe, expect, it } from "vitest"

import type { ProductSummary } from "@workspace/price/types"

import { relatedProducts } from "./related-products"

function product(
  id: string,
  item: string,
  price: number,
  perUnit: ProductSummary["perUnit"] = null,
  status: ProductSummary["status"] = "active"
): ProductSummary {
  return {
    id,
    name: `상품 ${id}`,
    item,
    category: "간편식·냉동",
    size: null,
    perUnit,
    price,
    surveyedOn: "2026-10-23",
    status,
    varietyId: null,
  }
}

const g = (price: number) => ({ unit: "100g", price })

describe("relatedProducts", () => {
  it("같은 품목의 다른 상품만, 자기 자신은 빼고 센다", () => {
    const list = [
      product("1", "국·탕", 2000),
      product("2", "국·탕", 1500),
      product("3", "라면", 900),
    ]
    expect(relatedProducts(list, list[0]!, 6)).toEqual({
      items: [list[1]],
      total: 1,
    })
  })

  it("기준 단위가 같은 상품을 단위당 가격 싼 순으로 앞에, 나머지는 판매가 싼 순으로 뒤에 둔다", () => {
    const self = product("1", "국·탕", 2000, g(400))
    const list = [
      self,
      product("2", "국·탕", 900),
      product("3", "국·탕", 3000, g(300)),
      product("4", "국·탕", 1000, g(500)),
      product("5", "국·탕", 700, { unit: "100ml", price: 100 }),
    ]
    expect(relatedProducts(list, self, 6).items.map(({ id }) => id)).toEqual([
      "3",
      "4",
      "5",
      "2",
    ])
  })

  it("조사 중단된 상품은 맨 뒤로 보낸다", () => {
    const self = product("1", "국·탕", 2000)
    const list = [
      self,
      product("2", "국·탕", 500, null, "discontinued"),
      product("3", "국·탕", 900, null, "stale"),
    ]
    expect(relatedProducts(list, self, 6).items.map(({ id }) => id)).toEqual([
      "3",
      "2",
    ])
  })

  it("count개까지만 담고 total은 전체 수다", () => {
    const self = product("0", "국·탕", 1)
    const list = [
      self,
      ...Array.from({ length: 8 }, (_, i) =>
        product(String(i + 1), "국·탕", 100 + i)
      ),
    ]
    const related = relatedProducts(list, self, 3)
    expect(related.items.map(({ id }) => id)).toEqual(["1", "2", "3"])
    expect(related.total).toBe(8)
  })
})
