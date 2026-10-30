import { describe, expect, it } from "vitest"

import { searchIndexSchema, VARIETY_SUMMARY_KEYS, varietyDetailSchema, varietySummarySchema } from "./schema"
import type { SearchIndex, VarietyDetail, VarietySummary } from "./types"

const SUMMARY: VarietySummary = {
  id: "napa-cabbage",
  name: "배추",
  item: "배추",
  category: "채소",
  spec: "상품",
  baseUnit: "1개",
  price: 4500,
  usual: 4150,
  verdict: { kind: "normal", pct: 8 },
  surveyedOn: "2026-10-29",
  sampleSize: 45,
  stale: false,
  meetsMinN: true,
  basis: { source: "KAMIS", scope: "전국 조사 시장" },
}

const DETAIL: VarietyDetail = {
  ...SUMMARY,
  band: { lower: -12, upper: 8 },
  range: { min: 3900, max: 5200, n: 45 },
  marketTypes: [
    { type: "traditional", median: 4940, n: 17 },
    { type: "large_retail", median: 3900, n: 28 },
  ],
  places: [
    { type: "large_retail", name: "대형마트 C", region: null, price: 3480, samples: [3480, 3480] },
    { type: "traditional", name: "신정시장", region: "울산", price: 5000, samples: [5000] },
  ],
  trend: [
    { date: "2026-10-28", price: 4480, usual: 4140 },
    { date: "2026-10-29", price: null, usual: null },
  ],
  forecast: [{ date: "2026-10-30", price: 4500, low: 4300, high: 4700 }],
  shelf: { surveyedOn: "2026-10-24", prices: [{ seller: "이마트", price: 4980, promo: "행사 ~10/29" }] },
}

const BEFORE_JUDGMENT: VarietyDetail = { ...DETAIL, usual: null, verdict: { kind: "none", pct: null }, forecast: [] }

describe("varietyDetailSchema", () => {
  it("판정 payload를 그대로 받는다", () => {
    expect(varietyDetailSchema.parse(DETAIL)).toEqual(DETAIL)
    expect(varietyDetailSchema.parse({ ...DETAIL, priceSpread: "brand" }).priceSpread).toBe("brand")
  })

  it("판정 전(평소가 없음) · 판매가 없음 · priceSpread 없음도 받는다", () => {
    expect(varietyDetailSchema.parse(BEFORE_JUDGMENT)).toEqual(BEFORE_JUDGMENT)
    expect(varietyDetailSchema.parse({ ...DETAIL, shelf: null }).shelf).toBeNull()
    expect(varietyDetailSchema.parse({ ...DETAIL, spec: null, meetsMinN: null })).not.toHaveProperty("priceSpread")
  })

  it("필수 필드가 빠지면 실패한다", () => {
    const { band: _band, ...noBand } = DETAIL
    const { basis: _basis, ...noBasis } = DETAIL
    expect(varietyDetailSchema.safeParse(noBand).success).toBe(false)
    expect(varietyDetailSchema.safeParse(noBasis).success).toBe(false)
    expect(varietyDetailSchema.safeParse({ ...DETAIL, verdict: { kind: "cheap" } }).success).toBe(false)
  })

  it("타입이 틀리면 실패한다", () => {
    const wrong = [
      { price: "4500" },
      { verdict: { kind: "bargain", pct: -20 } },
      { stale: "false" },
      { shelf: { surveyedOn: "2026-10-24", prices: [{ seller: "이마트", price: 4980 }] } },
      { marketTypes: [{ type: "online", median: 1, n: 1 }] },
      { priceSpread: "variety" },
      { trend: [{ date: "2026-10-29", price: 4500 }] },
    ]
    for (const over of wrong) expect(varietyDetailSchema.safeParse({ ...DETAIL, ...over }).success, JSON.stringify(over)).toBe(false)
  })

  it("알 수 없는 키는 버린다", () => {
    const parsed = varietyDetailSchema.parse({ ...DETAIL, label: "보통", basis: { ...DETAIL.basis, extra: 1 } })
    expect(parsed).not.toHaveProperty("label")
    expect(parsed.basis).toEqual(DETAIL.basis)
  })
})

describe("varietySummarySchema", () => {
  it("목록 행을 받는다", () => {
    expect(varietySummarySchema.parse(SUMMARY)).toEqual(SUMMARY)
  })

  it("무거운 키를 뺀 payload를 목록 행으로 읽고, 남은 상세 키는 버린다", () => {
    const { trend: _t, forecast: _f, places: _p, shelf: _s, marketTypes: _m, range: _r, band: _b, ...listed } = DETAIL
    const parsed = varietySummarySchema.parse({ ...listed, priceSpread: "brand" })
    expect(parsed).toEqual(SUMMARY)
  })

  it("필수 필드가 빠지거나 타입이 틀리면 실패한다", () => {
    const { surveyedOn: _surveyedOn, ...noDay } = SUMMARY
    expect(varietySummarySchema.safeParse(noDay).success).toBe(false)
    expect(varietySummarySchema.safeParse({ ...SUMMARY, sampleSize: null }).success).toBe(false)
  })
})

describe("searchIndexSchema", () => {
  const INDEX: SearchIndex = {
    varieties: [{ id: "napa-cabbage", name: "배추", item: "배추", category: "채소" }],
    aliases: [
      { text: "알배기", varietyId: "napa-cabbage" },
      { text: "고추", item: "풋고추" },
    ],
    categories: ["채소", "과일"],
  }

  it("검색 재료를 받고 알 수 없는 키는 버린다", () => {
    expect(searchIndexSchema.parse(INDEX)).toEqual(INDEX)
    const parsed = searchIndexSchema.parse({ ...INDEX, varieties: [{ ...INDEX.varieties[0], spec: "상품" }] })
    expect(parsed.varieties[0]).not.toHaveProperty("spec")
  })

  it("별칭이 품종도 품목도 가리키지 않으면 실패한다", () => {
    expect(searchIndexSchema.safeParse({ ...INDEX, aliases: [{ text: "고추" }] }).success).toBe(false)
  })
})

describe("VARIETY_SUMMARY_KEYS", () => {
  it("목록 행의 키와 같고, 상세 전용 키는 없다", () => {
    expect([...VARIETY_SUMMARY_KEYS].sort()).toEqual(Object.keys(SUMMARY).sort())
    for (const key of ["trend", "places", "shelf", "band"]) expect(VARIETY_SUMMARY_KEYS).not.toContain(key)
  })
})
