import { describe, expect, it } from "vitest"

import { addDays, agoLabel, daysBetween, isoDate, monthDay, signedPct, won } from "./format"

describe("won", () => {
  it("천 단위 쉼표, 원 단위 반올림", () => {
    expect(won(4500)).toBe("4,500")
    expect(won(13800)).toBe("13,800")
    expect(won(4149.6)).toBe("4,150")
  })
})

describe("날짜", () => {
  it("월/일", () => {
    expect(monthDay("2026-10-23")).toBe("10/23")
    expect(monthDay("2026-01-05")).toBe("1/5")
  })

  it("두 날짜 사이의 날 수", () => {
    expect(daysBetween("2026-10-09", "2026-10-23")).toBe(14)
    expect(daysBetween("2026-10-23", "2026-10-23")).toBe(0)
    expect(daysBetween("2026-02-27", "2026-03-02")).toBe(3)
  })

  it("날짜 더하기", () => {
    expect(addDays("2026-10-23", -30)).toBe("2026-09-23")
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
  })

  it("연 · 월 · 일 → 날짜 문자열", () => {
    expect(isoDate({ year: 2026, month: 3, day: 5 })).toBe("2026-03-05")
  })

  it("얼마 전", () => {
    expect(agoLabel(0)).toBe("오늘")
    expect(agoLabel(1)).toBe("어제")
    expect(agoLabel(4)).toBe("4일 전")
    expect(agoLabel(14)).toBe("2주 전")
    expect(agoLabel(20)).toBe("2주 전")
    expect(agoLabel(45)).toBe("1개월 전")
  })
})

describe("signedPct", () => {
  it("부호를 붙인다", () => {
    expect(signedPct(8)).toBe("+8%")
    expect(signedPct(-15)).toBe("-15%")
    expect(signedPct(0)).toBe("0%")
  })
})
