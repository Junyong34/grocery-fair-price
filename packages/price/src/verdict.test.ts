import { describe, expect, it } from "vitest"

import { DEFAULT_BAND, verdictOf } from "./verdict"

describe("verdictOf", () => {
  it("평소가 대비 차이를 반올림한 %로 낸다", () => {
    expect(verdictOf(4500, 4150, DEFAULT_BAND)).toEqual({ kind: "normal", pct: 8 })
    expect(verdictOf(4150, 4150, DEFAULT_BAND)).toEqual({ kind: "normal", pct: 0 })
  })

  it("구간 밖이면 싸요 · 비싸요", () => {
    expect(verdictOf(3900, 4600, DEFAULT_BAND)).toEqual({ kind: "cheap", pct: -15 })
    expect(verdictOf(6200, 5080, DEFAULT_BAND)).toEqual({ kind: "pricey", pct: 22 })
  })

  it("구간 경계는 보통이다", () => {
    expect(verdictOf(110, 100, DEFAULT_BAND)).toEqual({ kind: "normal", pct: 10 })
    expect(verdictOf(90, 100, DEFAULT_BAND)).toEqual({ kind: "normal", pct: -10 })
    expect(verdictOf(111, 100, DEFAULT_BAND).kind).toBe("pricey")
  })

  it("품종마다 다른 구간을 쓴다", () => {
    const narrow = { lower: -5, upper: 5 }
    expect(verdictOf(107, 100, narrow).kind).toBe("pricey")
    expect(verdictOf(107, 100, DEFAULT_BAND).kind).toBe("normal")
  })

  it("평소가가 없으면 판정 전", () => {
    expect(verdictOf(1250, null, DEFAULT_BAND)).toEqual({ kind: "none", pct: null })
    expect(verdictOf(1250, 0, DEFAULT_BAND)).toEqual({ kind: "none", pct: null })
  })
})
