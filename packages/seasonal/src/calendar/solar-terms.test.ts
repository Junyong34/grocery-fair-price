import { describe, expect, it } from "vitest"

import { winterSolstice } from "./lunar"
import { solarTermDate, solarTermInstant } from "./solar-terms"

const MINUTE = 60_000

describe("solarTermInstant", () => {
  it("춘분·하지·추분·동지 시각이 천문 시각과 2분 안으로 맞는다", () => {
    const cases: Array<[number, number, string]> = [
      [2024, 0, "2024-03-20T03:06:00Z"],
      [2024, 90, "2024-06-20T20:51:00Z"],
      [2024, 180, "2024-09-22T12:44:00Z"],
      [2024, 270, "2024-12-21T09:21:00Z"],
      [2025, 0, "2025-03-20T09:01:00Z"],
      [2025, 90, "2025-06-21T02:42:00Z"],
      [2025, 180, "2025-09-22T18:19:00Z"],
      [2025, 270, "2025-12-21T15:03:00Z"],
    ]
    for (const [year, longitude, expected] of cases) {
      const diff = Math.abs(solarTermInstant(year, longitude) - Date.parse(expected))
      expect(diff, `${year} ${longitude}°`).toBeLessThan(2 * MINUTE)
    }
  })

  it("1월의 절기(소한·대한)도 그 양력 연도 안에서 찾는다", () => {
    expect(new Date(solarTermInstant(2026, 285)).getUTCFullYear()).toBe(2026)
    expect(new Date(solarTermInstant(2026, 300)).getUTCMonth()).toBe(0)
  })
})

describe("solarTermDate", () => {
  it("서울 날짜로 바꾼다. 자정 가까운 절기도 날이 맞는다", () => {
    // 2025 입춘 2월 3일 23시 10분, 2024 처서 8월 22일 23시 55분, 2024 대한 1월 20일 23시 7분(서울)
    expect(solarTermDate(2025, 315)).toEqual({ year: 2025, month: 2, day: 3 })
    expect(solarTermDate(2024, 150)).toEqual({ year: 2024, month: 8, day: 22 })
    expect(solarTermDate(2024, 300)).toEqual({ year: 2024, month: 1, day: 20 })
    expect(solarTermDate(2024, 315)).toEqual({ year: 2024, month: 2, day: 4 })
    expect(solarTermDate(2026, 315)).toEqual({ year: 2026, month: 2, day: 4 })
    expect(solarTermDate(2024, 285)).toEqual({ year: 2024, month: 1, day: 6 })
  })

  it("동지 날짜가 동지 전용 계산(winterSolstice)과 같다", () => {
    for (let year = 1990; year <= 2060; year++) {
      expect(solarTermDate(year, 270), String(year)).toEqual(winterSolstice(year))
    }
  })
})
