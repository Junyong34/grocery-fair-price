// 판정 한 행 만들기 (ingest-foundation/11). 순수 함수.
import { varietyDetailSchema } from "@workspace/price/schema"
import { describe, expect, it } from "vitest"

import { buildJudgment, type JudgmentInput } from "../src/judgment/build.ts"

const DAY = "2026-10-29"

function input(over: Partial<JudgmentInput> = {}): JudgmentInput {
  return {
    variety: { slug: "napa-cabbage", name: "배추", item: "배추", category: "채소", baseUnit: "1개", spec: "상품" },
    latestDay: DAY,
    quote: { day: DAY, price: 4500, n: 45, min: 3900, max: 5200, meetsMinN: true, staleDays: null, sources: ["kamis"] },
    usual: { asOf: DAY, value: 4150.4, deviation: 0.084, band: { low: -0.12, high: 0.08 } },
    marketTypes: [
      { type: "traditional", median: 4940, n: 17 },
      { type: "large_retail", median: 3900, n: 28 },
    ],
    samples: [
      { market: "C-유통", marketType: "large_retail", sgg: "1101", price: 3480 },
      { market: "C-유통", marketType: "large_retail", sgg: "2100", price: 3480 },
      { market: "B-유통", marketType: "large_retail", sgg: "1101", price: 3900 },
      { market: "신정", marketType: "traditional", sgg: "2601", price: 5000 },
    ],
    trend: [
      { day: "2026-10-28", price: 4480, usual: 4140.2 },
      { day: DAY, price: 4500, usual: 4150.4 },
    ],
    shelf: null,
    ...over,
  }
}

const PARAMS = { staleDays: 7 }

describe("buildJudgment", () => {
  it("판정 차이는 평소가 행의 deviation, 구간은 band를 %로 바꿔 견준다", () => {
    const { row, payload } = buildJudgment(input(), PARAMS)
    // 8.4% → 8, 구간 끝(8)은 보통이다
    expect(payload.verdict).toEqual({ kind: "normal", pct: 8 })
    expect(payload.band).toEqual({ lower: -12, upper: 8 })
    expect(payload.price).toBe(4500)
    expect(payload.usual).toBe(4150)
    // 화면 %는 그날 시세로 다시 낸 값(4500 ÷ 4150 − 1 = 8%)이 아니라 deviation이다
    const other = buildJudgment(input({ usual: { asOf: DAY, value: 4150, deviation: -0.2, band: { low: -0.12, high: 0.08 } } }), PARAMS)
    expect(other.payload.verdict).toEqual({ kind: "cheap", pct: -20 })
    expect(other.row).toMatchObject({ verdict: "cheap", diffPct: -20 })
  })

  it("DB 판정 이름: pricey는 expensive, 판정 전은 null", () => {
    const pricey = buildJudgment(input({ usual: { asOf: DAY, value: 4000, deviation: 0.3, band: { low: -0.1, high: 0.1 } } }), PARAMS)
    expect(pricey.row).toMatchObject({ asOf: DAY, todayPrice: 4500, usual: 4000, verdict: "expensive", diffPct: 30 })
    const none = buildJudgment(input({ usual: null }), PARAMS)
    expect(none.row).toMatchObject({ usual: null, verdict: null, diffPct: null })
  })

  it("평소가가 없거나 시세 날짜와 다르면 판정 전", () => {
    for (const usual of [null, { asOf: "2026-10-28", value: 4100, deviation: 0, band: { low: -0.1, high: 0.1 } }]) {
      const { payload } = buildJudgment(input({ usual }), PARAMS)
      expect(payload.verdict).toEqual({ kind: "none", pct: null })
      expect(payload.usual).toBeNull()
      expect(payload.forecast).toEqual([])
      // 판정 전 화면은 시세 선만 그린다 (평소가 점선 · 띠 없음)
      expect(payload.trend.every((t) => t.usual === null)).toBe(true)
    }
  })

  it("판정 차이나 구간이 없는 평소가 행이면 판정 전", () => {
    const { payload } = buildJudgment(input({ usual: { asOf: DAY, value: 4100, deviation: null, band: null } }), PARAMS)
    expect(payload.verdict.kind).toBe("none")
  })

  it("표본 충분 · 조사 시장 수 · 범위", () => {
    const { payload } = buildJudgment(input({ quote: { ...input().quote, n: 3, meetsMinN: false } }), PARAMS)
    expect(payload).toMatchObject({ sampleSize: 3, meetsMinN: false, surveyedOn: DAY, range: { min: 3900, max: 5200, n: 3 } })
  })

  it("전국 값 하나로 오는 시세는 범위가 그 값이고 근거가 축평원이다", () => {
    const { payload } = buildJudgment(
      input({ quote: { day: DAY, price: 2914, n: 1, min: null, max: null, meetsMinN: true, staleDays: 2, sources: ["ekape"] }, samples: [] }),
      PARAMS,
    )
    expect(payload.range).toEqual({ min: 2914, max: 2914, n: 1 })
    expect(payload.basis).toEqual({ source: "축평원", scope: "전국 평균" })
    expect(payload.places).toEqual([])
  })

  it("갱신 지연: 같은 값이 7일 이상 이어졌거나, 조사일이 가장 최근 조사일보다 7일 이상 앞이다", () => {
    const stale = (quote: Partial<JudgmentInput["quote"]>) =>
      buildJudgment(input({ quote: { ...input().quote, ...quote } }), PARAMS).payload.stale
    expect(stale({})).toBe(false)
    expect(stale({ staleDays: 6 })).toBe(false)
    expect(stale({ staleDays: 7 })).toBe(true)
    expect(stale({ day: "2026-10-23" })).toBe(false)
    expect(stale({ day: "2026-10-22" })).toBe(true)
  })

  it("장소: 대형마트는 체인 기호로 묶고, 전통시장은 시장 하나가 한 행이다", () => {
    const { payload } = buildJudgment(input(), PARAMS)
    expect(payload.places).toEqual([
      { type: "large_retail", name: "대형마트 B", region: "서울", price: 3900, samples: [3900] },
      { type: "large_retail", name: "대형마트 C", region: null, price: 3480, samples: [3480, 3480] },
      { type: "traditional", name: "신정시장", region: "울산", price: 5000, samples: [5000] },
    ])
  })

  it("업태별 중간값과 추이를 원 단위 정수로 옮긴다", () => {
    const { payload } = buildJudgment(input(), PARAMS)
    expect(payload.marketTypes).toEqual([
      { type: "large_retail", median: 3900, n: 28 },
      { type: "traditional", median: 4940, n: 17 },
    ])
    expect(payload.trend).toEqual([
      { date: "2026-10-28", price: 4480, usual: 4140 },
      { date: DAY, price: 4500, usual: 4150 },
    ])
  })

  it("판매가: 판매처마다 행사 아닌 값의 중간값, 행사뿐이면 행사가와 끝나는 날", () => {
    const { payload } = buildJudgment(
      input({
        shelf: {
          day: "2026-10-09",
          sellers: [
            { seller: "이마트", prices: [{ price: 4980, promo: false, promoTo: null }, { price: 3980, promo: true, promoTo: "2026-10-15" }, { price: 5180, promo: false, promoTo: null }] },
            { seller: "홈플러스", prices: [{ price: 3990, promo: true, promoTo: "2026-10-12" }, { price: 4190, promo: true, promoTo: "2026-10-15" }] },
          ],
        },
      }),
      PARAMS,
    )
    expect(payload.shelf).toEqual({
      surveyedOn: "2026-10-09",
      prices: [
        { seller: "홈플러스", price: 4090, promo: "행사 ~10/15" },
        { seller: "이마트", price: 5080, promo: null },
      ],
    })
  })

  it("쌀처럼 브랜드마다 값이 다른 품종은 priceSpread를 붙인다", () => {
    expect(buildJudgment(input(), PARAMS).payload).not.toHaveProperty("priceSpread")
    const rice = buildJudgment(input({ variety: { ...input().variety, slug: "rice", spread: "brand" } }), PARAMS)
    expect(rice.payload.priceSpread).toBe("brand")
    expect(rice.payload.id).toBe("rice")
  })

  it("payload는 웹이 읽는 varietyDetailSchema를 통과한다(ADR 0004)", () => {
    const shelf = { day: DAY, sellers: [{ seller: "이마트", prices: [{ price: 4980, promo: true, promoTo: "2026-10-31" }] }] }
    for (const over of [{}, { usual: null }, { shelf }, { variety: { ...input().variety, spec: null, spread: "brand" as const } }]) {
      const { payload } = buildJudgment(input(over), PARAMS)
      expect(varietyDetailSchema.parse(payload)).toEqual(payload)
    }
  })
})
