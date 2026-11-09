import { describe, expect, it } from "vitest"

import { countByKind, describeProposal, type CatalogNames } from "./proposal-view"

const names: CatalogNames = {
  varieties: { "mackerel-kr": { name: "고등어(국산)", specs: { chilled: "냉장" } } },
  items: { "imported-fruit": "수입 과일", nuts: "견과" },
}

describe("제안 한 줄 설명", () => {
  it("slug 대신 이름으로 보인다", () => {
    expect(describeProposal({ kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" } }, names)).toBe("고등어(국산) · 냉장에 잇기")
    expect(describeProposal({ kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-l", name: "냉동 대" } } }, names)).toBe(
      "고등어(국산)에 새 규격 「냉동 대」",
    )
    expect(
      describeProposal(
        { kind: "new_variety", proposal: { item: "imported-fruit", variety: { slug: "orange-us", name: "오렌지(미국)", unit: "1개" }, spec: { slug: "top", name: "상품" } } },
        names,
      ),
    ).toBe("수입 과일에 새 식재료 「오렌지(미국)」 (1개, 규격 상품)")
    expect(describeProposal({ kind: "product_item", proposal: { item: "nuts" } }, names)).toBe("상품의 품목을 견과로")
    expect(describeProposal({ kind: "ignore", proposal: { reason: "2024-08부터 오지 않는다" } }, names)).toBe("2024-08부터 오지 않는다")
  })

  it("새 품목이나 모르는 slug는 slug를 그대로 쓴다", () => {
    expect(
      describeProposal(
        { kind: "new_variety", proposal: { item: { slug: "hairtail", name: "갈치", category: "seafood" }, variety: { slug: "h", name: "갈치(수입)", unit: "1개" }, spec: { slug: "l", name: "냉동 대" } } },
        names,
      ),
    ).toBe("새 품목 「갈치」에 새 식재료 「갈치(수입)」 (1개, 규격 냉동 대)")
    expect(describeProposal({ kind: "map", proposal: { variety: "x", spec: "y" } }, names)).toBe("x · y에 잇기")
  })
})

describe("종류별 개수", () => {
  it("종류마다 센다", () => {
    expect(countByKind([{ kind: "map" }, { kind: "hold" }, { kind: "map" }])).toEqual({ map: 2, hold: 1 })
  })
})
