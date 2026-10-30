// 품종 카탈로그가 실측 코드표·제철 품종·variety-list.md와 맞는지 (ingest-foundation/08)
import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { CATEGORIES, ITEMS, VARIETIES, type VarietyDef } from "../src/catalog/varieties.ts"

const repo = new URL("../../../", import.meta.url)
const read = (path: string) => readFileSync(new URL(path, repo), "utf8")

// 따옴표 안의 쉼표를 나누지 않는다 (참가격 상품 이름 "무(줄기 없는 무, 1.5kg)")
const fields = (line: string) => [...line.matchAll(/("(?:[^"]|"")*"|[^,]*)(?:,|$)/g)].slice(0, -1).map((m) => m[1]!.replace(/^"|"$/g, ""))

function csv(path: string): Record<string, string>[] {
  const [head, ...lines] = read(path).trim().split("\n")
  const cols = fields(head!)
  return lines.map((l) => Object.fromEntries(fields(l).map((v, i) => [cols[i], v])))
}

const inventory = "grocery-price/reference/public-data/samples/inventory/"
const kamisRetail = csv(`${inventory}kamis-varieties.csv`).filter((r) => r.se_cd === "01")
const ekapeKeys = new Set(
  csv(`${inventory}ekape-items.csv`).map((r) => `${r.judgeKind}-${r.itemCd}-${r["grdNm(등급·원산지)"]}`),
)
const chamgaFresh = new Set(
  csv(`${inventory}cham-products.csv`).filter((r) => r.대분류 === "신선식품").map((r) => Number(r.goodId)),
)
const seasonalIds = new Set(
  [...read("packages/seasonal/src/data/foods.generated.ts").matchAll(/id: "([a-z0-9-]+)"/g)].map((m) => m[1]),
)

const specs = VARIETIES.flatMap((v) => v.specs.map((s) => ({ variety: v, spec: s })))

describe("카탈로그 모양", () => {
  it("slug가 겹치지 않는다", () => {
    for (const slugs of [CATEGORIES.map((c) => c.slug), ITEMS.map((i) => i.slug), VARIETIES.map((v) => v.slug)]) {
      expect(new Set(slugs).size).toBe(slugs.length)
    }
    for (const v of VARIETIES) expect(new Set(v.specs.map((s) => s.slug)).size, v.slug).toBe(v.specs.length)
  })

  it("품목·카테고리가 있고, 품종마다 규격이 하나 이상이고 원천 키가 하나 이상이다", () => {
    const items = new Set(ITEMS.map((i) => i.slug))
    const categories = new Set(CATEGORIES.map((c) => c.slug))
    for (const i of ITEMS) expect(categories.has(i.category), i.slug).toBe(true)
    for (const v of VARIETIES) {
      expect(items.has(v.item), v.slug).toBe(true)
      expect(v.specs.length, v.slug).toBeGreaterThan(0)
      for (const s of v.specs) {
        const n = (s.kamis?.length ?? 0) + (s.ekape?.length ?? 0) + (s.chamga?.length ?? 0)
        expect(n, `${v.slug}/${s.slug}`).toBeGreaterThan(0)
      }
    }
  })

  it("원천 키 하나는 규격 하나에만 잇는다", () => {
    for (const source of ["kamis", "ekape", "chamga"] as const) {
      const keys = specs.flatMap(({ spec }) => (spec[source] ?? []).map(String))
      expect(keys.filter((k, i) => keys.indexOf(k) !== i), source).toEqual([])
    }
  })
})

// 실측한 날(10-19)에는 소매로 오지 않았지만 운영 관측값에 있는 키. 사과 부사는 철이 바뀌는 10월 중순에 잠깐 빠진다
// (운영 source_item 2023-01-02 ~ 2026-10-29, 2026-10-30 확인)
const KAMIS_SEEN_LATER = new Set(["411-05-04", "411-05-05"])

describe("실측 코드표 (samples/inventory, 2026-10-19)", () => {
  // 품종 `*`(배추·무)는 철마다 오는 코드가 달라 그 품목이 있는지만 본다
  it("KAMIS 키는 소매로 오는 품목·품종·등급이다", () => {
    const matches = (key: string) => {
      const [item, vrty, grd] = key.split("-")
      if (KAMIS_SEEN_LATER.has(key)) return true
      if (vrty === "*") return kamisRetail.some((r) => r.item_cd === item)
      return kamisRetail.some((r) => r.item_cd === item && r.vrty_cd === vrty && r.grd_cd === grd)
    }
    const missing = specs.flatMap(({ spec }) => spec.kamis ?? []).filter((k) => !matches(k))
    expect(missing).toEqual([])
  })

  it("KAMIS 소매 품목·품종·등급은 모두 어느 규격에 잇는다", () => {
    const keys = specs.flatMap(({ spec }) => spec.kamis ?? [])
    const covered = (r: Record<string, string>) =>
      keys.some((k) => {
        const [item, vrty, grd] = k.split("-")
        return r.item_cd === item && (vrty === "*" || r.vrty_cd === vrty) && r.grd_cd === grd
      })
    expect(kamisRetail.filter((r) => !covered(r)).map((r) => `${r.item_cd}-${r.vrty_cd}-${r.grd_cd} ${r.item_nm}`)).toEqual([])
  })

  it("축평원 키는 코드표에 있고, 코드표의 키는 모두 잇는다", () => {
    const keys = specs.flatMap(({ spec }) => spec.ekape ?? [])
    expect(keys.filter((k) => !ekapeKeys.has(k))).toEqual([])
    expect([...ekapeKeys].filter((k) => !keys.includes(k))).toEqual([])
  })

  it("참가격 상품은 신선식품이다", () => {
    expect(specs.flatMap(({ spec }) => spec.chamga ?? []).filter((id) => !chamgaFresh.has(id))).toEqual([])
  })
})

describe("제철 품종", () => {
  it("제철 id가 packages/seasonal에 있다", () => {
    const missing = VARIETIES.flatMap((v) => v.seasonal ?? []).filter((id) => !seasonalIds.has(id))
    expect(missing).toEqual([])
  })
})

// variety-list.md의 품종 표 행: 품목 | 품종 | 규격 | 기준 단위 | KAMIS | 축평원 | 참가격 | 커버 | 제철 id | 메모
function mdRows() {
  return read("grocery-price/docs/30-data/variety-list.md")
    .split("\n")
    .filter((l) => l.startsWith("| ") && l.includes("**"))
    .map((l) => l.slice(1, -1).split("|").map((c) => c.trim()))
    .map((c) => ({ name: c[1]!.replaceAll("*", ""), unit: c[3]!, cover: c[7]!, seasonal: c[8]! }))
}

function cover(v: VarietyDef): string {
  const daily = v.specs.some((s) => s.kamis?.length || s.ekape?.length)
  const store = v.specs.some((s) => s.chamga?.length)
  if (daily) return store ? "충분 + 점포" : "충분"
  return "부분 (참가격만)"
}

// md는 1포기·1마리·1장도 개수 단위로 적었다
const unitOf = (md: string) => (["1포기", "1마리", "1장"].includes(md) ? "1개" : md)

describe("variety-list.md와 같다", () => {
  it("품종 이름·기준 단위·제철 id", () => {
    const rows = mdRows()
    expect(rows.map((r) => r.name)).toEqual(VARIETIES.map((v) => v.name))
    for (const [i, v] of VARIETIES.entries()) {
      const row = rows[i]!
      expect(unitOf(row.unit), v.name).toBe(v.unit)
      expect(row.seasonal, v.name).toBe(v.seasonal?.[0] ?? "-")
    }
  })

  // 참가격 볶음참깨는 원산지가 없어 잇지 않았으므로 md의 "충분 + 점포"와 다르다
  it("커버 상태 (참깨(국산) 하나만 다르다)", () => {
    const diff = mdRows()
      .map((r, i) => ({ name: r.name, md: r.cover, catalog: cover(VARIETIES[i]!) }))
      .filter((d) => d.md !== d.catalog)
    expect(diff).toEqual([{ name: "참깨(국산)", md: "충분 + 점포", catalog: "충분" }])
  })
})
