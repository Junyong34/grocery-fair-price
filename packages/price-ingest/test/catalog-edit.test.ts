// 제안 하나를 카탈로그 사본에 반영한다 (catalog-scale/08). DB에는 importSnapshot이 넣는다
import { describe, expect, it } from "vitest"

import { editSnapshot, revertSnapshot } from "../src/catalog/edit.ts"
import { diffSnapshots } from "../src/catalog/rules.ts"
import type { CatalogSnapshot } from "../src/catalog/types.ts"

const base: CatalogSnapshot = {
  categories: [{ slug: "seafood", name: "수산" }, { slug: "fruit", name: "과일" }],
  items: [{ slug: "mackerel", name: "고등어", category: "seafood" }, { slug: "imported-fruit", name: "수입 과일", category: "fruit" }],
  varieties: [
    { slug: "mackerel-kr", name: "고등어(국산)", item: "mackerel", unit: "1개", specs: [{ slug: "chilled", name: "냉장", kamis: ["611-05-20"] }] },
    { slug: "orange", name: "오렌지", item: "imported-fruit", unit: "1개", specs: [{ slug: "default", name: "기본", kamis: ["421-06-05"], chamga: [500] }] },
  ],
  exceptions: [{ source: "kamis", key: "611-06-20", action: "hold", reason: "근거 없음" }],
  sourceCategories: [],
}

describe("제안 → 사본", () => {
  it("map은 원천 키를 그 규격에 붙이고 보류 예외를 지운다", () => {
    const out = editSnapshot(base, { source: "kamis", key: "611-06-20", kind: "map", proposal: { variety: "mackerel-kr", spec: "chilled" } })
    expect(out.varieties[0]?.specs[0]?.kamis).toEqual(["611-05-20", "611-06-20"])
    expect(out.exceptions).toEqual([])
  })

  it("new_spec은 기본 규격을 바꾸지 않고 끝에 더한다", () => {
    const out = editSnapshot(base, { source: "kamis", key: "611-06-20", kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-l", name: "냉동 대" } } })
    expect(out.varieties[0]?.specs.map((s) => s.slug)).toEqual(["chilled", "frozen-l"])
    expect(out.varieties[0]?.specs[1]).toEqual({ slug: "frozen-l", name: "냉동 대", kamis: ["611-06-20"] })
  })

  it("new_variety는 같은 품목의 품종 뒤에 넣고, 새 품목이면 같은 카테고리의 품목 뒤에 넣는다", () => {
    const out = editSnapshot(base, {
      source: "kamis", key: "421-03-04", kind: "new_variety",
      proposal: { item: "imported-fruit", variety: { slug: "orange-us", name: "오렌지(미국)", unit: "1개" }, spec: { slug: "top", name: "상품" } },
    })
    expect(out.varieties.map((v) => v.slug)).toEqual(["mackerel-kr", "orange", "orange-us"])
    expect(out.varieties[2]).toEqual({ slug: "orange-us", name: "오렌지(미국)", item: "imported-fruit", unit: "1개", specs: [{ slug: "top", name: "상품", kamis: ["421-03-04"] }] })

    const fish = editSnapshot(base, {
      source: "kamis", key: "613-05-20", kind: "new_variety",
      proposal: { item: { slug: "hairtail", name: "갈치", category: "seafood" }, variety: { slug: "hairtail-imported", name: "갈치(수입)", unit: "1개" }, spec: { slug: "frozen-l", name: "냉동 대" } },
    })
    expect(fish.items.map((i) => i.slug)).toEqual(["mackerel", "hairtail", "imported-fruit"])
    expect(fish.varieties.at(-1)?.slug).toBe("hairtail-imported")
  })

  it("ignore·hold는 다른 규격에 붙은 같은 키를 떼고 예외 하나로 둔다", () => {
    const out = editSnapshot(base, { source: "kamis", key: "611-05-20", kind: "ignore", proposal: { reason: "더 오지 않는다" } })
    expect(out.varieties[0]?.specs[0]?.kamis).toBeUndefined()
    expect(out.exceptions).toContainEqual({ source: "kamis", key: "611-05-20", action: "ignore", reason: "더 오지 않는다" })
    const held = editSnapshot(base, { source: "kamis", key: "611-06-20", kind: "hold", proposal: { reason: "새 이유" } })
    expect(held.exceptions).toEqual([{ source: "kamis", key: "611-06-20", action: "hold", reason: "새 이유" }])
  })

  it("참가격 키는 숫자로 붙인다. product_item은 품종을 고른 때만 사본을 바꾼다", () => {
    const out = editSnapshot(base, { source: "chamga", key: "501", kind: "product_item", proposal: { item: "imported-fruit", variety: "orange", spec: "default" } })
    expect(out.varieties[1]?.specs[0]?.chamga).toEqual([500, 501])
    expect(editSnapshot(base, { source: "chamga", key: "501", kind: "product_item", proposal: { item: "imported-fruit" } })).toEqual(base)
  })

  it("product_item은 새 품목을 같은 카테고리의 품목 뒤에 만들고, 같은 새 품목을 다시 가리키면 그대로 둔다", () => {
    const ramen = { slug: "ramen", name: "라면", category: "fruit" }
    const out = editSnapshot(base, { source: "chamga", key: "900", kind: "product_item", proposal: { item: ramen } })
    expect(out.items.map((i) => i.slug)).toEqual(["mackerel", "imported-fruit", "ramen"])
    expect(editSnapshot(out, { source: "chamga", key: "901", kind: "product_item", proposal: { item: ramen } })).toBe(out)
    expect(() => editSnapshot(out, { source: "chamga", key: "902", kind: "product_item", proposal: { item: { ...ramen, name: "봉지라면" } } })).toThrow(/ramen/)
    expect(() => editSnapshot(base, { source: "chamga", key: "903", kind: "product_item", proposal: { item: { ...ramen, category: "nope" } } })).toThrow(/nope/)
  })

  it("없는 품종·규격, 이미 있는 slug, 묶기는 멈춘다", () => {
    expect(() => editSnapshot(base, { source: "kamis", key: "1", kind: "map", proposal: { variety: "x", spec: "y" } })).toThrow(/품종 x/)
    expect(() => editSnapshot(base, { source: "kamis", key: "1", kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "chilled", name: "냉장" } } })).toThrow(/이미/)
    expect(() => editSnapshot(base, { source: "kamis", key: "1", kind: "merge", proposal: { variety: "orange", spec: "default" } })).toThrow(/묶기/)
  })
})

describe("되돌리기", () => {
  it("변경 기록의 전 값으로 돌리면 처음 사본과 같다", () => {
    const edited = editSnapshot(
      editSnapshot(base, { source: "kamis", key: "611-06-20", kind: "new_spec", proposal: { variety: "mackerel-kr", spec: { slug: "frozen-l", name: "냉동 대" } } }),
      { source: "kamis", key: "613-05-20", kind: "new_variety", proposal: { item: { slug: "hairtail", name: "갈치", category: "seafood" }, variety: { slug: "hairtail-imported", name: "갈치(수입)", unit: "1개" }, spec: { slug: "frozen-l", name: "냉동 대" } } },
    )
    const changes = diffSnapshots(base, edited)
    expect(revertSnapshot(edited, changes)).toEqual(base)
  })
})
