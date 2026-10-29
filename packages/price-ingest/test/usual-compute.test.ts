// 여러 품종·규격의 평소가 한 번에 내기 (judgment.md 1·2장). 순수 함수.
import { describe, expect, it } from "vitest"

import { addDays } from "../src/ingest/collect.ts"
import { computeUsual, seasonAsOf, type SpecSeries } from "../src/usual/compute.ts"
import { dayOfYear, type Point } from "../src/usual/season.ts"

function series(from: string, to: string, price: (day: string, i: number) => number): Point[] {
  const out: Point[] = []
  for (let day = from, i = 0; day <= to; day = addDays(day, 1), i++) out.push({ day, price: price(day, i) })
  return out
}
const wave = (day: string) => 1 + 0.2 * -Math.cos((2 * Math.PI * dayOfYear(day)) / 365)

const yearRound: SpecSeries = { varietyId: 1, specId: 10, category: "vegetable", points: series("2023-01-01", "2026-10-28", (d, i) => 1000 * 1.05 ** (i / 365) * wave(d)) }
const seasonal: SpecSeries = {
  varietyId: 2,
  specId: 20,
  category: "fruit",
  points: series("2023-01-01", "2026-10-28", () => 3000).filter((p) => p.day.slice(5, 7) >= "06" && p.day.slice(5, 7) <= "09"),
}

describe("computeUsual", () => {
  it("계절비율 기준일은 그 달 1일의 전날이다", () => {
    expect(seasonAsOf("2026-10-28")).toBe("2026-09-30")
    expect(seasonAsOf("2026-01-01")).toBe("2025-12-31")
  })

  it("기간의 시세 있는 날마다 평소가를 내고, 가장 최근 날에만 판정 구간을 붙인다", () => {
    const { usual } = computeUsual([yearRound], { from: "2026-10-20", to: "2026-10-28" })
    expect(usual.map((r) => r.asOf)).toEqual(Array.from({ length: 9 }, (_, i) => addDays("2026-10-20", i)))
    expect(usual.slice(0, -1).every((r) => r.components.band === undefined)).toBe(true)
    // 판정한 날이 1년이 안 돼(2025-12-30부터) 카테고리 공통 구간
    expect(usual.at(-1)!.components.band).toMatchObject({ basis: "category" })
    const today = yearRound.points.at(-1)!
    expect(Math.abs(today.price / usual.at(-1)!.value - 1)).toBeLessThan(0.05)
  })

  it("같은 품종에서 조사 시장이 절반보다 적은 규격은 평소가를 내지 않는다", () => {
    const top = { ...yearRound, points: yearRound.points.map((p) => ({ ...p, n: 48 })) }
    const mid = { ...yearRound, specId: 11, points: yearRound.points.map((p) => ({ ...p, price: p.price * 0.7, n: 17 })) }
    const { usual, season } = computeUsual([top, mid], { from: "2026-10-28", to: "2026-10-28" })
    expect(usual.map((r) => r.specId)).toEqual([10])
    expect(season.filter((r) => r.specId === 11)).toHaveLength(365)
  })

  it("제철 품목은 평소가를 내지 않지만 계절비율 표는 만든다", () => {
    const { usual, season } = computeUsual([yearRound, seasonal], { from: "2026-09-01", to: "2026-09-30" })
    expect(usual.every((r) => r.specId === 10)).toBe(true)
    const seasonalRows = season.filter((r) => r.specId === 20)
    expect(seasonalRows.length).toBeGreaterThan(100) // 6~9월 앞뒤 7일
    expect(seasonalRows.length).toBeLessThan(150)
    expect(season.filter((r) => r.specId === 10)).toHaveLength(365)
    expect(season.every((r) => r.asOf === "2026-08-31")).toBe(true)
    // 3년 × 15일 = 45. 윤년의 2월 29일은 28일 칸에 더해져 46까지
    expect(Math.max(...season.map((r) => r.n))).toBe(46)
    expect(Math.min(...season.map((r) => r.n))).toBeGreaterThan(0)
  })
})
