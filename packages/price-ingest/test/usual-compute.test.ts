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

  it("가장 최근 행에 판정 차이(최근 3일 편차의 중앙값)를 남긴다. 마지막 하루만 튀면 판정 차이는 따라가지 않는다", () => {
    const spike = { ...yearRound, points: yearRound.points.map((p) => (p.day === "2026-10-28" ? { ...p, price: p.price * 1.3 } : p)) }
    const { usual } = computeUsual([spike], { from: "2026-10-20", to: "2026-10-28" })
    const priceOf = new Map(spike.points.map((p) => [p.day, p.price]))
    const devs = usual.slice(-3).map((r) => priceOf.get(r.asOf)! / r.value - 1)
    expect(devs[2]).toBeGreaterThan(0.2)
    expect(usual.at(-1)!.components.deviation).toBeCloseTo([...devs].sort((a, b) => a - b)[1]!, 10)
    expect(usual.at(-1)!.components.deviation).toBeLessThan(0.05)
    expect(usual.slice(0, -1).every((r) => r.components.deviation === undefined)).toBe(true)
  })

  it("같은 품종에서 조사 시장이 절반보다 적은 규격은 평소가를 내지 않는다", () => {
    const top = { ...yearRound, points: yearRound.points.map((p) => ({ ...p, n: 48 })) }
    const mid = { ...yearRound, specId: 11, points: yearRound.points.map((p) => ({ ...p, price: p.price * 0.7, n: 17 })) }
    const { usual, season } = computeUsual([top, mid], { from: "2026-10-28", to: "2026-10-28" })
    expect(usual.map((r) => r.specId)).toEqual([10])
    expect(season.filter((r) => r.specId === 11)).toHaveLength(365)
  })

  it("계절비율을 1로 둔 규격은 시세가 없던 날의 칸에도 1과 3년 비율 수를 둔다", () => {
    // 해마다 18% 오르는 때가 다르고, 해마다 2월은 시세가 없다
    const peak = (day: string) => (day >= "2025-10-28" ? [9, 10, 11] : day >= "2024-10-28" ? [6, 7, 8] : [3, 4, 5])
    const points = series("2023-01-01", "2026-10-28", (day) => 2500 * (peak(day).includes(Number(day.slice(5, 7))) ? 1.18 : 1)).filter(
      (p) => p.day.slice(5, 7) !== "02",
    )
    const { season, usual } = computeUsual([{ varietyId: 3, specId: 30, category: "grain", points }], { from: "2026-10-28", to: "2026-10-28" })
    expect(season).toHaveLength(365)
    expect(new Set(season.map((r) => r.value))).toEqual(new Set([1]))
    expect(new Set(season.map((r) => r.n)).size).toBe(1)
    expect(season[0]!.n).toBeGreaterThan(900)
    expect(usual[0]!.components).toMatchObject({ season_flat: true, season_index: 1 })
  })

  it("제철 품목은 평소가를 내지 않지만 계절비율 표는 만든다", () => {
    const { usual, season } = computeUsual([yearRound, seasonal], { from: "2026-09-01", to: "2026-09-30" })
    expect(usual.every((r) => r.specId === 10)).toBe(true)
    const seasonalRows = season.filter((r) => r.specId === 20)
    expect(seasonalRows).toHaveLength(122 + 2 * 14) // 6~9월(122일) 앞뒤 14일
    expect(season.filter((r) => r.specId === 10)).toHaveLength(365)
    expect(season.every((r) => r.asOf === "2026-08-31")).toBe(true)
    // 3년 × 29일 = 87. 윤년의 2월 29일은 28일 칸에 더해져 88까지
    expect(Math.max(...season.map((r) => r.n))).toBe(88)
    expect(Math.min(...season.map((r) => r.n))).toBeGreaterThan(0)
  })
})
