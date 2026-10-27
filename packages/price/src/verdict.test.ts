import { describe, expect, it } from "vitest"

import { DEFAULT_BAND, usualRange, verdictOf } from "./verdict"

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
    // 정확히 +10.5%는 11%로 올림한다(부동소수로 10.4999…%가 되지 않는다)
    expect(verdictOf(1105, 1000, DEFAULT_BAND)).toEqual({ kind: "pricey", pct: 11 })
    expect(verdictOf(895, 1000, DEFAULT_BAND)).toEqual({ kind: "normal", pct: -10 })
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

describe("usualRange", () => {
  it("평소가가 없으면 없다", () => {
    expect(usualRange(null, DEFAULT_BAND)).toBeNull()
    expect(usualRange(0, DEFAULT_BAND)).toBeNull()
  })

  it("반올림한 %로 판정하므로 경계는 구간 끝에서 0.5%p 바깥이다", () => {
    const range = usualRange(1000, DEFAULT_BAND)!
    expect(range.low).toBeCloseTo(895)
    expect(range.high).toBeCloseTo(1105)
  })

  it("띠 안의 가격은 보통, 밖의 가격은 싸요 · 비싸요다", () => {
    for (const usual of [4146, 1000, 873, 25790]) {
      for (const band of [DEFAULT_BAND, { lower: -5, upper: 8 }]) {
        const { low, high } = usualRange(usual, band)!
        for (let price = Math.floor(usual * 0.8); price <= usual * 1.2; price++) {
          const inside = price >= low && price < high
          expect(verdictOf(price, usual, band).kind === "normal", `${price}/${usual}`).toBe(inside)
        }
      }
    }
  })

  it("+10.4%는 보통이고 띠 안에 든다", () => {
    expect(verdictOf(4580, 4150, DEFAULT_BAND)).toEqual({ kind: "normal", pct: 10 })
    expect(usualRange(4150, DEFAULT_BAND)!.high).toBeGreaterThan(4580)
  })
})
