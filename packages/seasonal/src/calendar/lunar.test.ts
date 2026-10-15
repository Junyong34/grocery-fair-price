import { describe, expect, it } from "vitest"

import { lunarToSolar, winterSolstice } from "./lunar"

describe("lunarToSolar", () => {
  it("설날·추석의 양력 날짜를 구한다(관보 날짜)", () => {
    expect(lunarToSolar(2026, 1, 1)).toEqual({ year: 2026, month: 2, day: 17 })
    expect(lunarToSolar(2026, 8, 15)).toEqual({ year: 2026, month: 9, day: 25 })
    expect(lunarToSolar(2027, 1, 1)).toEqual({ year: 2027, month: 2, day: 7 })
    expect(lunarToSolar(2027, 8, 15)).toEqual({ year: 2027, month: 9, day: 15 })
  })

  it("정월대보름·단오도 구한다", () => {
    expect(lunarToSolar(2026, 1, 15)).toEqual({ year: 2026, month: 3, day: 3 })
    expect(lunarToSolar(2027, 1, 15)).toEqual({ year: 2027, month: 2, day: 21 })
    expect(lunarToSolar(2026, 5, 5)).toEqual({ year: 2026, month: 6, day: 19 })
    expect(lunarToSolar(2027, 5, 5)).toEqual({ year: 2027, month: 6, day: 9 })
  })

  it("윤달은 건너뛰고 평달만 센다", () => {
    // 2025년은 윤6월(7/25~8/22)이 있다. 음력 7월 1일은 윤달 뒤인 8월 23일이다.
    expect(lunarToSolar(2025, 7, 1)).toEqual({ year: 2025, month: 8, day: 23 })
  })
})

describe("winterSolstice", () => {
  it("서울 기준 동지 날짜(12월 21일 또는 22일)", () => {
    expect(winterSolstice(2026)).toEqual({ year: 2026, month: 12, day: 22 })
    expect(winterSolstice(2027)).toEqual({ year: 2027, month: 12, day: 22 })
    expect(winterSolstice(2029)).toEqual({ year: 2029, month: 12, day: 21 })
  })
})
