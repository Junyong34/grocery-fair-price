import { describe, expect, it } from "vitest"

import { comparesMyPrice, detailPicture, dotsPicture } from "./detail-picture"
import type { VarietyDetail } from "./types"
import { usualRange } from "./verdict"

// 평소가 1000원, 구간 ±10%: 평소 범위는 895 이상 1105 미만이다.
const DETAIL: VarietyDetail = {
  id: "zucchini",
  name: "애호박",
  item: "호박",
  category: "채소",
  spec: "상품",
  baseUnit: "1개",
  price: 1000,
  usual: 1000,
  verdict: { kind: "normal", pct: 0 },
  surveyedOn: "2026-11-12",
  sampleSize: 30,
  stale: false,
  meetsMinN: true,
  basis: { source: "KAMIS", scope: "전국 조사 시장" },
  band: { lower: -10, upper: 10 },
  range: { min: 900, max: 1100, n: 30 },
  marketTypes: [],
  places: [],
  trend: [],
  forecast: [],
  shelf: null,
}

const NO_USUAL: VarietyDetail = { ...DETAIL, usual: null, verdict: { kind: "none", pct: null } }
const BRAND: VarietyDetail = { ...DETAIL, priceSpread: "brand" }

describe("comparesMyPrice", () => {
  it("평소가가 있으면 내가 본 가격을 견줄 수 있다", () => {
    expect(comparesMyPrice(DETAIL)).toBe(true)
  })

  it("평소가가 없으면(또는 0 이하면) 견줄 수 없다", () => {
    expect(comparesMyPrice(NO_USUAL)).toBe(false)
    expect(comparesMyPrice({ ...DETAIL, usual: 0 })).toBe(false)
  })

  it("품종 · 브랜드 편차가 큰 품종(쌀 등)은 견주지 않는다: 브랜드 값을 일반 시세에 대면 늘 한쪽으로 나온다", () => {
    expect(comparesMyPrice(BRAND)).toBe(false)
  })
})

describe("detailPicture", () => {
  it("평소가가 없으면 내가 본 가격을 적어도 견주지 않고, 평소가 띠 · 눈금이 없다", () => {
    const picture = detailPicture(NO_USUAL, 1200)
    expect(picture.comparesMyPrice).toBe(false)
    expect(picture.mine).toBeNull()
    expect(picture.band).toBeNull()
    expect(picture.usualAt).toBeNull()
    // 내가 본 가격은 축에도 넣지 않는다
    expect(picture.axis.max).toBeCloseTo(1100 + 200 * 0.08)
  })

  it("품종 · 브랜드 편차가 큰 품종은 예전에 적어 둔 값이 있어도 핀을 꽂지 않는다", () => {
    const picture = detailPicture(BRAND, 1200)
    expect(picture.comparesMyPrice).toBe(false)
    expect(picture.mine).toBeNull()
    // 평소 범위 띠는 그대로 그린다
    expect(picture.band).not.toBeNull()
  })

  it("평소 범위 띠를 축에 넣고, 띠 · 평소가 · 조사 범위 · 시세 핀의 자리를 낸다", () => {
    const picture = detailPicture(DETAIL)
    const { low, high } = usualRange(1000, DETAIL.band)!
    // 축은 조사 범위 · 시세 · 평소 범위 띠를 모두 담고 양 끝에 8% 여백을 둔다
    const pad = (high - low) * 0.08
    expect(picture.axis.min).toBeCloseTo(low - pad)
    expect(picture.axis.max).toBeCloseTo(high + pad)
    expect(picture.band!.from).toBeCloseTo(picture.axis.at(low))
    expect(picture.band!.to).toBeCloseTo(picture.axis.at(high))
    expect(picture.usualAt).toBeCloseTo(0.5)
    expect(picture.survey.from).toBeCloseTo(picture.axis.at(900))
    expect(picture.survey.to).toBeCloseTo(picture.axis.at(1100))
    expect(picture.quote).toEqual({ at: picture.axis.at(1000), tone: "normal" })
    expect(picture.comparesMyPrice).toBe(true)
    expect(picture.mine).toBeNull()
  })

  it("내가 본 가격을 평소가와 견준 판정과 핀 자리를 낸다", () => {
    const picture = detailPicture(DETAIL, 1050)
    expect(picture.mine).toEqual({ price: 1050, usual: 1000, verdict: { kind: "normal", pct: 5 }, at: picture.axis.at(1050) })
    expect(detailPicture(DETAIL, 850).mine!.verdict).toEqual({ kind: "cheap", pct: -15 })
    expect(detailPicture(DETAIL, null).mine).toBeNull()
  })

  it("내가 본 가격이 범위 밖이면 축을 넓혀 핀이 끝에 붙지 않게 한다", () => {
    const picture = detailPicture(DETAIL, 1500)
    const { low } = usualRange(1000, DETAIL.band)!
    const pad = (1500 - low) * 0.08
    expect(picture.axis.max).toBeCloseTo(1500 + pad)
    expect(picture.axis.min).toBeCloseTo(low - pad)
    expect(picture.mine!.at).toBeLessThan(1)
    expect(picture.mine!.verdict.kind).toBe("pricey")
  })
})

describe("dotsPicture", () => {
  it("점 값과 평소 범위 띠를 모두 담는 축(여백 6%)과 띠 · 평소가 자리를 낸다", () => {
    const picture = dotsPicture(DETAIL, [700, 800])
    const { high } = usualRange(1000, DETAIL.band)!
    const pad = (high - 700) * 0.06
    expect(picture.axis.min).toBeCloseTo(700 - pad)
    expect(picture.axis.max).toBeCloseTo(high + pad)
    expect(picture.band!.to).toBeCloseTo(picture.axis.at(high))
    expect(picture.usualAt).toBeCloseTo(picture.axis.at(1000))
  })

  it("평소가가 없으면 점 값만으로 축을 잡고 띠 · 눈금이 없다", () => {
    const picture = dotsPicture(NO_USUAL, [700, 800])
    expect(picture.axis.min).toBeCloseTo(700 - 100 * 0.06)
    expect(picture.band).toBeNull()
    expect(picture.usualAt).toBeNull()
  })
})
