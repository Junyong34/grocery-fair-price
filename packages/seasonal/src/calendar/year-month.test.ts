import { describe, expect, it } from "vitest"

import { clampYear, formatYearMonth, parseYearMonth } from "./year-month"

describe("formatYearMonth", () => {
  it("연-월을 두 자리 달로 적는다", () => {
    expect(formatYearMonth(2026, 3)).toBe("2026-03")
    expect(formatYearMonth(2026, 11)).toBe("2026-11")
  })
})

describe("parseYearMonth", () => {
  it("formatYearMonth의 역이다", () => {
    expect(parseYearMonth("2026-03")).toEqual({ year: 2026, month: 3 })
    expect(parseYearMonth(formatYearMonth(2027, 12))).toEqual({ year: 2027, month: 12 })
  })

  it("형식이 틀리거나 없는 달이면 null", () => {
    for (const value of ["2026-3", "2026-00", "2026-13", "26-03", "2026-03-01", "abc", ""]) expect(parseYearMonth(value)).toBeNull()
  })
})

describe("clampYear", () => {
  const years = [2026, 2027]
  it("범위 안의 해는 그대로다", () => {
    expect(clampYear(2026, years)).toBe(2026)
    expect(clampYear(2027, years)).toBe(2027)
  })
  it("범위 밖이면 가까운 끝으로 붙인다", () => {
    expect(clampYear(2030, years)).toBe(2027)
    expect(clampYear(2020, years)).toBe(2026)
  })
})
