import { describe, expect, it } from "vitest"

import { spikesOf, trendWindow } from "./trend"
import type { TrendPoint } from "./types"

const day = (d: number) => `2026-10-${String(d).padStart(2, "0")}`
const p = (d: number, price: number | null, usual: number | null = 100): TrendPoint => ({ date: day(d), price, usual })
const BAND = { lower: -10, upper: 10 }

describe("trendWindow", () => {
  it("마지막 날에서 days일 전까지", () => {
    const trend = [p(1, 100), p(2, 100), p(3, 100), p(4, 100)]
    expect(trendWindow(trend, 2).map((x) => x.date)).toEqual([day(2), day(3), day(4)])
    expect(trendWindow(trend, 30)).toHaveLength(4)
    expect(trendWindow([], 30)).toEqual([])
  })
})

describe("spikesOf", () => {
  it("평소 범위를 벗어난 구간마다 가장 많이 벗어난 날 하나", () => {
    const trend = [p(1, 100), p(2, 112), p(3, 125), p(4, 115), p(5, 100), p(6, 85), p(7, 80), p(8, 100)]
    expect(spikesOf(trend, BAND)).toEqual([
      { date: day(3), price: 125, usual: 100, kind: "pricey", pct: 25 },
      { date: day(7), price: 80, usual: 100, kind: "cheap", pct: -20 },
    ])
  })

  it("시세나 평소가가 없는 날은 건너뛰고 구간을 끊는다", () => {
    const trend = [p(1, 120), p(2, null), p(3, 130), p(4, 130, null)]
    expect(spikesOf(trend, BAND).map((s) => s.date)).toEqual([day(1), day(3)])
  })

  it("평소가가 없으면 없다", () => {
    expect(spikesOf([p(1, 150, null)], BAND)).toEqual([])
  })
})
