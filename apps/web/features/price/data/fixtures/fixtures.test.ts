import { describe, expect, it } from "vitest"

import { detailOf } from "./details"
import { ALIASES, FEATURED_IDS, VARIETIES } from "./varieties"

const ids = new Set(VARIETIES.map((variety) => variety.id))

describe("하드코딩 데이터", () => {
  it("품종 id는 겹치지 않고, 자주 사는 품종 · 별칭이 있는 품종을 가리킨다", () => {
    expect(ids.size).toBe(VARIETIES.length)
    expect(FEATURED_IDS.filter((id) => !ids.has(id))).toEqual([])
    expect(ALIASES.flatMap((alias) => ("varietyId" in alias && !ids.has(alias.varietyId) ? [alias.text] : []))).toEqual([])
  })

  it("상태 화면을 볼 품종이 있다: 판정 전 · 오래됨 · 표본 적음", () => {
    expect(VARIETIES.filter((v) => v.verdict.kind === "none").map((v) => v.name)).toEqual(["쥬키니", "샤인머스켓", "호주산 등심", "찹쌀"])
    expect(VARIETIES.some((v) => v.stale)).toBe(true)
    expect(VARIETIES.some((v) => v.meetsMinN === false)).toBe(true)
  })

  it("배추는 와이어프레임 값", () => {
    const baechu = detailOf(VARIETIES.find((v) => v.id === "napa-cabbage")!)
    expect(baechu.verdict).toEqual({ kind: "normal", pct: 8 })
    expect(baechu.range).toEqual({ min: 3900, max: 5200, n: 45 })
    expect(baechu.marketTypes.map((q) => q.median)).toEqual([3900, 4940])
    expect(baechu.trend.at(-1)).toEqual({ date: "2026-10-23", price: 4500, usual: 4150 })
  })

  it("모든 품종의 상세가 앞뒤가 맞는다", () => {
    for (const summary of VARIETIES) {
      const detail = detailOf(summary)
      const last = detail.trend.at(-1)!
      expect(last.date, summary.name).toBe(summary.surveyedOn)
      expect(last.price, summary.name).toBe(summary.price)
      expect(last.usual, summary.name).toBe(summary.usual)
      expect(detail.trend.length, summary.name).toBe(183)
      expect(detail.places.length, summary.name).toBeGreaterThan(0)
      expect(detail.forecast.length > 0, summary.name).toBe(summary.usual != null)
      expect(detail.range.min <= detail.range.max, summary.name).toBe(true)
    }
  })
})
