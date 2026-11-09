// 카탈로그 규칙 (catalog-scale/04): snapshot → 규칙 행, 규칙 행 → 원천 키 찾기, 두 사본의 차이
import { describe, expect, it } from "vitest"

import { CatalogIndex, diffSnapshots, rulesOfSnapshot, type Rule } from "../src/catalog/rules.ts"
import type { CatalogSnapshot } from "../src/catalog/types.ts"

const snapshot: CatalogSnapshot = {
  categories: [{ slug: "vegetable", name: "채소" }, { slug: "meat", name: "정육·계란" }],
  items: [{ slug: "napa-cabbage", name: "배추", category: "vegetable" }, { slug: "pork", name: "돼지고기", category: "meat" }],
  varieties: [
    { slug: "napa-cabbage", name: "배추", item: "napa-cabbage", unit: "1개", specs: [{ slug: "top", name: "상품", kamis: ["211-*-04"], chamga: [1000] }] },
    {
      slug: "pork-belly", name: "삼겹살", item: "pork", unit: "100g",
      specs: [{ slug: "default", name: "기본", kamis: ["4304-27-1"], ekape: ["4304-27-삼겹살"] }],
    },
  ],
  exceptions: [{ source: "kamis", key: "211-01-05", action: "ignore", reason: "중품은 받지 않는다" }],
  sourceCategories: [],
}

describe("snapshot → 규칙 행", () => {
  const rules = rulesOfSnapshot(snapshot)

  it("규격의 원천 키마다 map 규칙 하나, 예외마다 ignore·hold 규칙 하나", () => {
    expect(rules).toEqual<Rule[]>([
      { source: "kamis", key: "211-*-04", action: "map", variety: "napa-cabbage", spec: "top", unitRule: "retail-ea", role: "primary", reason: null },
      { source: "chamga", key: "1000", action: "map", variety: "napa-cabbage", spec: "top", unitRule: "retail-ea", role: "primary", reason: null },
      { source: "kamis", key: "4304-27-1", action: "map", variety: "pork-belly", spec: "default", unitRule: "retail-g", role: "secondary", reason: null },
      { source: "ekape", key: "4304-27-삼겹살", action: "map", variety: "pork-belly", spec: "default", unitRule: "retail-g", role: "primary", reason: null },
      { source: "kamis", key: "211-01-05", action: "ignore", variety: null, spec: null, unitRule: null, role: null, reason: "중품은 받지 않는다" },
    ])
  })

  it("KAMIS는 소매만, 정확한 키가 먼저고 없으면 품종 `*`로 찾는다", () => {
    const index = new CatalogIndex(rules)
    expect(index.kamis({ se_cd: "01", item_cd: "211", vrty_cd: "06", grd_cd: "04" })?.variety).toBe("napa-cabbage")
    expect(index.kamis({ se_cd: "02", item_cd: "211", vrty_cd: "06", grd_cd: "04" })).toBeUndefined()
    expect(index.kamis({ se_cd: "01", item_cd: "211", vrty_cd: "01", grd_cd: "05" })?.action).toBe("ignore")
    expect(index.ekape({ judgeKind: "4304", itemCd: "27", grdNm: "삼겹살" })?.role).toBe("primary")
    expect(index.chamga(1000)?.spec).toBe("top")
    expect(index.chamga(9999)).toBeUndefined()
  })

  it("KAMIS가 대표인 원천 키가 있는 품목만 백필 대상이다", () => {
    expect([...new CatalogIndex(rules).kamisPrimaryItemCodes()]).toEqual(["211"])
  })

  it("같은 원천 키를 두 규격에 이으면 멈춘다", () => {
    const twice = { ...snapshot, exceptions: [{ source: "kamis" as const, key: "211-*-04", action: "hold" as const, reason: "x" }] }
    expect(() => rulesOfSnapshot(twice)).toThrow(/211-\*-04/)
  })
})

describe("두 사본의 차이 (변경 기록)", () => {
  it("바뀐 분류 단위(카테고리·품목·품종·예외)만 전후 값으로 돌려준다", () => {
    const after: CatalogSnapshot = {
      ...snapshot,
      varieties: [{ ...snapshot.varieties[0]!, name: "배추(봄)" }, snapshot.varieties[1]!],
      exceptions: [],
      items: [...snapshot.items, { slug: "ramen", name: "라면", category: "meat" }],
    }
    const changes = diffSnapshots(snapshot, after)
    expect(changes.map((c) => [c.target, c.targetKey, c.action])).toEqual([
      ["item", "ramen", "insert"],
      ["variety", "napa-cabbage", "update"],
      ["exception", "kamis:211-01-05", "delete"],
    ])
    expect(changes[1]!.after).toMatchObject({ name: "배추(봄)" })
    expect(diffSnapshots(snapshot, snapshot)).toEqual([])
    const reordered = { ...snapshot, categories: snapshot.categories.map((c) => ({ name: c.name, slug: c.slug })) }
    expect(diffSnapshots(snapshot, reordered)).toEqual([])
  })
})
