// 평소가 = 수준 × 계절비율 (judgment.md 1-3, ②). 순수 함수만 본다.
import { describe, expect, it } from "vitest"

import { addDays } from "../src/ingest/collect.ts"
import {
  activeMonths,
  bandOf,
  chooseBand,
  dayOfYear,
  levelOf,
  median,
  noUsualReason,
  SEASON_DEFAULTS,
  seasonIndex,
  seasonRatios,
  recentMarketCount,
  thinGrades,
  usualPrice,
  type Point,
} from "../src/usual/season.ts"

// from부터 to까지 매일 price(day)인 시세
function series(from: string, to: string, price: (day: string, i: number) => number): Point[] {
  const out: Point[] = []
  for (let day = from, i = 0; day <= to; day = addDays(day, 1), i++) out.push({ day, price: price(day, i) })
  return out
}

// 1년 주기로 ±amp만큼 오르내리는 계절 모양 (1월 1일이 바닥, 7월 초가 꼭대기)
const wave = (day: string, amp: number) => 1 + amp * -Math.cos((2 * Math.PI * dayOfYear(day)) / 365)

describe("기본 도구", () => {
  it("중앙값", () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(median([])).toBeNull()
  })

  it("한 해의 날 번호는 윤년과 상관없이 0~364이고, 2월 29일은 2월 28일과 같다", () => {
    expect(dayOfYear("2026-01-01")).toBe(0)
    expect(dayOfYear("2026-12-31")).toBe(364)
    expect(dayOfYear("2024-12-31")).toBe(364)
    expect(dayOfYear("2024-02-29")).toBe(dayOfYear("2024-02-28"))
    expect(dayOfYear("2024-03-01")).toBe(dayOfYear("2026-03-01"))
  })
})

describe("계절비율", () => {
  it("한 해를 다 채운 날부터 시세 ÷ 그날을 끝으로 하는 365일 중앙값을 낸다", () => {
    const flat = series("2023-01-01", "2024-03-01", () => 1000)
    const ratios = seasonRatios(flat)
    expect(ratios[0]!.day).toBe("2023-12-31") // 첫날부터 365일째
    expect(ratios.every((r) => r.ratio === 1)).toBe(true)
  })

  it("물가가 해마다 올라도 계절 모양만 남는다", () => {
    // 연 10% 오르고 ±20% 계절 변동
    const prices = series("2023-01-01", "2026-10-28", (day, i) => 1000 * 1.1 ** (i / 365) * wave(day, 0.2))
    const index = seasonIndex(seasonRatios(prices), "2026-10-28")
    const peak = index.get(dayOfYear("2026-07-02"))!
    const trough = index.get(dayOfYear("2026-01-01"))!
    expect(peak).toBeGreaterThan(1.15)
    expect(trough).toBeLessThan(0.85)
    // 물가 상승은 비율에 남지 않는다: 같은 날의 계절비율은 해마다 같은 모양에서 온다
    expect(peak / trough).toBeCloseTo(1.2 / 0.8, 1)
  })

  it("3년 창 밖의 비율은 쓰지 않고, 제철이 아닌 날(±7일 안에 시세가 없음)은 비운다", () => {
    // 여름(6~8월)에만 나오는 품목
    const prices = series("2022-01-01", "2026-10-28", (day) => (day.slice(5, 7) >= "06" && day.slice(5, 7) <= "08" ? 3000 : NaN)).filter(
      (p) => !Number.isNaN(p.price),
    )
    const index = seasonIndex(seasonRatios(prices), "2026-10-28")
    expect(index.has(dayOfYear("2026-07-15"))).toBe(true)
    expect(index.has(dayOfYear("2026-02-15"))).toBe(false)
    // 2022년 비율이 섞이면 이 값이 달라진다: 2023-10-28 이전 비율은 창 밖
    const recent = seasonRatios(prices).filter((r) => r.day > "2023-10-28")
    expect(seasonIndex(recent, "2026-10-28")).toEqual(index)
  })
})

describe("수준과 평소가", () => {
  const prices = series("2023-01-01", "2026-10-28", (day, i) => 1000 * 1.1 ** (i / 365) * wave(day, 0.2))
  const index = seasonIndex(seasonRatios(prices), "2026-10-28")

  it("수준은 최근 26주 시세에서 계절을 걷어 낸 값이라 지금 물가를 따른다", () => {
    const level = levelOf(prices, index, "2026-10-28")!
    const now = 1000 * 1.1 ** (prices.length / 365)
    expect(level / now).toBeGreaterThan(0.9)
    expect(level / now).toBeLessThan(1.05)
  })

  it("평소가 = 수준 × 그날의 계절비율이라, 계절대로 움직인 오늘 시세는 평소가 근처다", () => {
    const today = prices.at(-1)!
    const usual = usualPrice(prices, index, today.day, today.day)!
    expect(Math.abs(today.price / usual.value - 1)).toBeLessThan(0.05)
    expect(usual.components).toMatchObject({ season_index: index.get(dayOfYear(today.day)), level_weeks: 26, season_years: 3 })
  })

  it("최근 26주에 시세가 있는 주가 8주보다 적으면 수준을 내지 않는다 (판정 전)", () => {
    const keepFrom = (from: string) => prices.filter((p) => p.day < "2026-04-01" || p.day >= from)
    expect(levelOf(keepFrom("2026-08-20"), index, "2026-10-28")).not.toBeNull() // 약 10주
    expect(levelOf(keepFrom("2026-09-20"), index, "2026-10-28")).toBeNull() // 약 6주
  })

  it("계절비율 이력이 2년보다 짧으면 평소가를 내지 않는다", () => {
    const short = prices.filter((p) => p.day >= "2025-01-01")
    const shortIndex = seasonIndex(seasonRatios(short), "2026-10-28")
    expect(usualPrice(short, shortIndex, "2026-10-28", "2026-10-28")).toBeNull()
    expect(noUsualReason(short, shortIndex, "2026-10-28", "2026-10-28")).toBe("short_history")
  })

  it("최근 12개월 중 시세가 있는 달이 10달보다 적은 제철 품목은 평소가를 내지 않는다", () => {
    // 6~10월에만 나오는 품목 (평일만 조사해도 달 수는 같다)
    const seasonal = prices.filter((p) => p.day.slice(5, 7) >= "06" && p.day.slice(5, 7) <= "10")
    const seasonalIndex = seasonIndex(seasonRatios(seasonal), "2026-10-28")
    expect(activeMonths(seasonal, "2026-10-28")).toBe(5) // 2025-11~2026-10 중 6~10월
    expect(usualPrice(seasonal, seasonalIndex, "2026-10-28", "2026-10-28")).toBeNull()
    expect(noUsualReason(seasonal, seasonalIndex, "2026-10-28", "2026-10-28")).toBe("seasonal_item")
    // 평일만 오는 1년 내내 품목은 판정한다
    const weekdays = prices.filter((p) => ![0, 6].includes(new Date(`${p.day}T00:00:00Z`).getUTCDay()))
    const weekdayIndex = seasonIndex(seasonRatios(weekdays), "2026-10-28")
    expect(activeMonths(weekdays, "2026-10-28")).toBe(12)
    expect(usualPrice(weekdays, weekdayIndex, "2026-10-28", "2026-10-28")).not.toBeNull()
    expect(noUsualReason(weekdays, weekdayIndex, "2026-10-28", "2026-10-28")).toBeNull()
  })
})

describe("표본이 적은 규격", () => {
  it("최근 26주 하루 조사 시장 수의 중앙값", () => {
    const points = series("2026-01-01", "2026-10-28", (_, i) => 1000).map((p, i) => ({ ...p, n: i % 2 === 0 ? 48 : 50 }))
    expect(recentMarketCount(points, "2026-10-28")).toBe(49)
    expect(recentMarketCount(series("2026-01-01", "2026-10-28", () => 1), "2026-10-28")).toBeNull()
  })

  it("같은 품종에서 조사 시장이 가장 많은 규격의 절반보다 적은 규격은 판정하지 않는다 (감자 상품 48곳, 중품 17곳)", () => {
    expect(thinGrades(new Map([["상품", 48], ["중품", 17]]))).toEqual(new Set(["중품"]))
    expect(thinGrades(new Map([["상품", 50], ["중품", 25]]))).toEqual(new Set())
    expect(thinGrades(new Map([["기본", 3]]))).toEqual(new Set()) // 규격이 하나면 비교하지 않는다
    expect(thinGrades(new Map([["상품", 40], ["중품", null]]))).toEqual(new Set())
  })
})

describe("판정 구간", () => {
  it("지난 시세 ÷ 평소가의 하위·상위 20%, 바닥 ±5%·천장 ±25%", () => {
    const deviations = Array.from({ length: 101 }, (_, i) => (i - 50) / 500) // -10% ~ +10%
    expect(bandOf(deviations)).toEqual({ low: -0.06, high: 0.06 })
    expect(bandOf(deviations.map((d) => d / 10))).toEqual({ low: -0.05, high: 0.05 }) // 바닥
    expect(bandOf(deviations.map((d) => d * 10))).toEqual({ low: -0.25, high: 0.25 }) // 천장
    expect(bandOf([])).toBeNull()
  })

  it("판정한 날이 1년보다 적으면 카테고리 공통 구간을 쓴다", () => {
    const narrow = Array.from({ length: 101 }, (_, i) => (i - 50) / 500) // ±10%
    const wide = narrow.map((d) => d * 2) // ±20%
    expect(chooseBand(narrow.slice(0, 100), wide)).toEqual({ low: -0.12, high: 0.12, basis: "category" })
    const year = Array.from({ length: 365 }, (_, i) => (i - 182) / 1820) // ±10%
    expect(chooseBand(year, wide)).toEqual({ low: -0.06, high: 0.06, basis: "variety" })
    expect(chooseBand([], [])).toBeNull()
  })

  it("기본값은 judgment.md의 가정과 같다", () => {
    expect(SEASON_DEFAULTS).toEqual({
      windowDays: 7,
      seasonYears: 3,
      minHistoryDays: 730,
      levelDays: 182,
      minLevelWeeks: 8,
      minActiveMonths: 10,
      minBandDays: 365,
      minGradeShare: 0.5,
      bandPercentile: 0.2,
      bandFloor: 0.05,
      bandCeiling: 0.25,
    })
  })
})
