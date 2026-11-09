import { describe, expect, it } from "vitest"

import { nearestIndex, spacedIndexes, trendStats } from "./trend-scale"

const points = [
  { date: "2026-09-01", median: 2400, min: 2100 },
  { date: "2026-09-15", median: 2200, min: 1800 },
  { date: "2026-10-01", median: 2600, min: 2000 },
  { date: "2026-10-27", median: 2200, min: 2000 },
]

describe("trendStats", () => {
  it("전국 판매가의 기간 최고 · 최저 · 평균과 첫 조사 대비 변화를 낸다", () => {
    expect(trendStats(points)).toEqual({
      first: points[0],
      last: points[3],
      high: { date: "2026-10-01", value: 2600 },
      low: { date: "2026-10-27", value: 2200 },
      average: 2350,
      change: -200,
    })
  })

  it("같은 값이 여러 번이면 가장 최근 조사일을 고른다", () => {
    const stats = trendStats(points)
    expect(stats?.low.date).toBe("2026-10-27")
  })

  it("평균은 원 단위로 반올림한다", () => {
    const stats = trendStats([
      { date: "2026-09-01", median: 1000, min: 900 },
      { date: "2026-09-02", median: 1001, min: 900 },
    ])
    expect(stats?.average).toBe(1001)
  })

  it("조사 기록이 없으면 null", () => {
    expect(trendStats([])).toBeNull()
  })
})

describe("spacedIndexes", () => {
  it("처음과 끝은 늘 두고, 사이 값은 앞뒤와 minGap 이상 떨어질 때만 둔다", () => {
    expect(spacedIndexes([0, 5, 20, 40, 45, 90, 100], 20)).toEqual([0, 2, 3, 6])
  })

  it("끝에 너무 붙은 사이 값은 뺀다", () => {
    expect(spacedIndexes([0, 50, 90, 100], 20)).toEqual([0, 1, 3])
  })

  it("하나면 그 하나, 비어 있으면 빈 목록", () => {
    expect(spacedIndexes([0], 20)).toEqual([0])
    expect(spacedIndexes([], 20)).toEqual([])
  })
})

describe("nearestIndex", () => {
  it("가장 가까운 자리의 순번, 같은 거리면 뒤쪽(최근)", () => {
    expect(nearestIndex([0, 25, 100], 10)).toBe(0)
    expect(nearestIndex([0, 25, 100], 70)).toBe(2)
    expect(nearestIndex([0, 20, 40], 10)).toBe(1)
  })

  it("범위를 벗어나면 끝에 붙인다", () => {
    expect(nearestIndex([0, 50, 100], -20)).toBe(0)
    expect(nearestIndex([0, 50, 100], 140)).toBe(2)
  })
})
