import { describe, expect, it } from "vitest"

import { HOLIDAY_YEARS } from "./holidays"
import { STATIC_YEARS, staticYearMonth } from "./static-years"

describe("STATIC_YEARS", () => {
  it("서비스 첫해(2026)부터 공휴일 데이터가 있는 마지막 해까지다", () => {
    expect(STATIC_YEARS[0]).toBe(2026)
    expect(STATIC_YEARS.at(-1)).toBe(Math.max(...HOLIDAY_YEARS))
    expect(STATIC_YEARS.every((year, i) => i === 0 || year === STATIC_YEARS[i - 1]! + 1)).toBe(true)
  })
})

describe("staticYearMonth", () => {
  it("서울 오늘의 연-월을 미리 그린 범위로 고정한다", () => {
    expect(staticYearMonth({ year: 2026, month: 11, day: 5 })).toBe("2026-11")
    const last = STATIC_YEARS.at(-1)!
    expect(staticYearMonth({ year: last + 3, month: 4, day: 1 })).toBe(`${last}-04`)
  })
})
