import { describe, expect, it } from "vitest"

import { groupByItem, latestSurveyedOn, pickByIds, productCategories, relatedInCategory } from "./list"

const row = (id: string, surveyedOn: string) => ({ id, surveyedOn })

describe("latestSurveyedOn", () => {
  it("가장 최근 조사일", () => {
    expect(latestSurveyedOn([row("a", "2026-10-09"), row("b", "2026-10-23"), row("c", "2026-10-20")])).toBe("2026-10-23")
  })

  it("빈 목록이면 null", () => {
    expect(latestSurveyedOn([])).toBeNull()
  })
})

describe("pickByIds", () => {
  it("id 순서대로 고르고 없는 id는 건너뛴다", () => {
    const rows = [row("a", ""), row("b", ""), row("c", "")]
    expect(pickByIds(rows, ["c", "x", "a"]).map((r) => r.id)).toEqual(["c", "a"])
  })
})

describe("relatedInCategory", () => {
  const rows = [
    { id: "a", category: "채소" },
    { id: "x", category: "과일" },
    { id: "b", category: "채소" },
    { id: "c", category: "채소" },
    { id: "d", category: "채소" },
  ]

  it("같은 카테고리에서 그 품종 다음 것부터 돌아가며 고르고 자기 자신은 뺀다", () => {
    expect(relatedInCategory(rows, "c", 2).map((r) => r.id)).toEqual(["d", "a"])
    expect(relatedInCategory(rows, "a", 10).map((r) => r.id)).toEqual(["b", "c", "d"])
  })

  it("같은 카테고리에 다른 품종이 없거나 목록에 없는 id면 빈 배열", () => {
    expect(relatedInCategory(rows, "x", 3)).toEqual([])
    expect(relatedInCategory(rows, "nope", 3)).toEqual([])
  })
})

describe("groupByItem", () => {
  it("품목이 처음 나온 순서로 묶고, 묶음 안 순서는 그대로 둔다", () => {
    const rows = [
      { id: "1", item: "라면" },
      { id: "2", item: "국수" },
      { id: "3", item: "라면" },
    ]
    expect(groupByItem(rows)).toEqual([
      { item: "라면", rows: [rows[0], rows[2]] },
      { item: "국수", rows: [rows[1]] },
    ])
  })

  it("빈 목록이면 빈 배열", () => {
    expect(groupByItem([])).toEqual([])
  })
})

describe("productCategories", () => {
  const categories = [
    { slug: "fruit", name: "과일" },
    { slug: "noodles", name: "라면·면" },
    { slug: "dairy", name: "유제품" },
  ]
  const products = [
    { category: "유제품", item: "우유" },
    { category: "라면·면", item: "라면" },
    { category: "유제품", item: "치즈" },
    { category: "유제품", item: "우유" },
  ]

  it("상품이 있는 카테고리만 카테고리 순서대로, 상품 수와 품목 이름을 단다", () => {
    expect(productCategories(categories, products)).toEqual([
      { slug: "noodles", name: "라면·면", count: 1, items: ["라면"] },
      { slug: "dairy", name: "유제품", count: 3, items: ["우유", "치즈"] },
    ])
  })

  it("카테고리 목록에 없는 이름의 상품은 뺀다(주소를 만들 slug가 없다)", () => {
    expect(productCategories(categories, [{ category: "기타", item: "무엇" }])).toEqual([])
  })
})
