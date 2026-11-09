// 카탈로그 제안 흐름의 순수한 부분 (catalog-scale/06): 원천 키 표기, 비슷한 품종 찾기, 제안 파일 검사
import { describe, expect, it } from "vitest"

import { keyPatternOf, parseProposalFile, recentEnough, similarVarieties, type CatalogVarietyRef } from "../src/catalog/proposal.ts"
import type { Rule } from "../src/catalog/rules.ts"

describe("원천 키 표기", () => {
  it("catalog_key_rule.key_pattern과 같은 모양으로 만든다", () => {
    expect(keyPatternOf("kamis", { se_cd: "01", ctgry_cd: "600", item_cd: "611", vrty_cd: "06", grd_cd: "20" })).toBe("611-06-20")
    expect(keyPatternOf("ekape", { judgeKind: "4304", itemCd: "27", grdNm: "삼겹살" })).toBe("4304-27-삼겹살")
    expect(keyPatternOf("chamga", { goodId: "1000" })).toBe("1000")
  })

  it("필드가 빠지면 멈춘다", () => {
    expect(() => keyPatternOf("kamis", { item_cd: "611" })).toThrow(/611/)
  })
})

describe("최근 관측", () => {
  it("오늘에서 N일 안에 관측된 것만", () => {
    expect(recentEnough("2026-10-10", "2026-11-09", 30)).toBe(true)
    expect(recentEnough("2026-10-09", "2026-11-09", 30)).toBe(false)
    expect(recentEnough("2026-01-01", "2026-11-09", undefined)).toBe(true)
  })
})

describe("비슷한 기존 품종", () => {
  const varieties: CatalogVarietyRef[] = [
    { slug: "mackerel", name: "고등어", item: "mackerel", itemName: "고등어", specs: ["chilled", "salted"] },
    { slug: "sesame-kr", name: "참깨(국산)", item: "sesame", itemName: "참깨", specs: ["default"] },
    { slug: "sesame-cn", name: "참깨(중국)", item: "sesame", itemName: "참깨", specs: ["default"] },
    { slug: "melon", name: "멜론", item: "melon", itemName: "멜론", specs: ["default"] },
  ]
  const rules: Rule[] = [
    { source: "kamis", key: "611-05-04", action: "map", variety: "mackerel", spec: "chilled", unitRule: "retail-ea", role: "primary", reason: null },
    { source: "kamis", key: "611-07-04", action: "map", variety: "mackerel", spec: "salted", unitRule: "retail-ea", role: "primary", reason: null },
    { source: "kamis", key: "6110-01-04", action: "ignore", variety: null, spec: null, unitRule: null, role: null, reason: "다른 품목" },
  ]

  it("KAMIS는 같은 품목 코드의 규칙과 이름이 같은 품종을 함께 준다", () => {
    const found = similarVarieties({ source: "kamis", key: "611-06-20", label: "고등어/국산(냉동)/大" }, varieties, rules)
    expect(found.sameCode.map((r) => r.key)).toEqual(["611-05-04", "611-07-04"])
    expect(found.byName.map((v) => v.slug)).toEqual(["mackerel"])
  })

  it("괄호 앞 이름으로 원산지가 다른 품종을 모두 찾는다", () => {
    const found = similarVarieties({ source: "chamga", key: "1500", label: "참깨 볶음 200g" }, varieties, rules)
    expect(found.sameCode).toEqual([])
    expect(found.byName.map((v) => v.slug)).toEqual(["sesame-kr", "sesame-cn"])
  })

  it("이름이 없으면 비운다", () => {
    expect(similarVarieties({ source: "kamis", key: "999-00-04", label: null }, varieties, rules).byName).toEqual([])
  })
})

describe("제안 파일", () => {
  const map = { source: "kamis", key: "611-06-20", kind: "map", proposal: { variety: "mackerel", spec: "frozen" }, rationale: "고등어 냉동 大", confidence: "high" }

  it("kind마다 정한 모양만 받는다", () => {
    const parsed = parseProposalFile([
      map,
      { source: "kamis", key: "611-06-21", kind: "new_spec", proposal: { variety: "mackerel", spec: { slug: "frozen-medium", name: "냉동 중" } }, rationale: "r" },
      {
        source: "kamis", key: "257-00-04", kind: "new_variety",
        proposal: { item: "melon", variety: { slug: "melon-2", name: "멜론2", unit: "1개" }, spec: { slug: "top", name: "상품" } }, rationale: "r", confidence: "low",
      },
      { source: "chamga", key: "1000", kind: "product_item", proposal: { item: "ramen" }, rationale: "r" },
      { source: "kamis", key: "257-00-05", kind: "hold", proposal: { reason: "근거 부족" }, rationale: "r" },
    ])
    expect(parsed.map((p) => p.kind)).toEqual(["map", "new_spec", "new_variety", "product_item", "hold"])
    expect(parsed[1]?.confidence).toBeNull()
  })

  it("모양이 틀리거나 근거가 없거나 같은 키가 두 번이면 파일 전체를 받지 않는다", () => {
    expect(() => parseProposalFile([{ ...map, proposal: { variety: "mackerel" } }])).toThrow()
    expect(() => parseProposalFile([{ ...map, rationale: "" }])).toThrow()
    expect(() => parseProposalFile([{ ...map, kind: "ignore", proposal: {} }])).toThrow()
    expect(() => parseProposalFile([map, map])).toThrow(/kamis:611-06-20/)
  })
})
