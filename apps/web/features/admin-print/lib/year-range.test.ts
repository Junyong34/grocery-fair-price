import { describe, expect, it } from "vitest"

import { DEFAULT_SPECS } from "@workspace/seasonal/print/spec"

import { isInPrintYearRange, kindHasYear, printYearChoices, printYearError, printYearRange, specYear } from "./year-range"

describe("printYearRange", () => {
  it("올해 기준 5년 전부터 1년 뒤까지다", () => {
    expect(printYearRange(2026)).toEqual({ min: 2021, max: 2027 })
  })
})

describe("isInPrintYearRange", () => {
  it("양 끝을 포함하고 바깥은 뺀다", () => {
    expect(isInPrintYearRange(2021, 2026)).toBe(true)
    expect(isInPrintYearRange(2027, 2026)).toBe(true)
    expect(isInPrintYearRange(2020, 2026)).toBe(false)
    expect(isInPrintYearRange(2028, 2026)).toBe(false)
  })

  it("정수가 아니면 범위 밖이다", () => {
    expect(isInPrintYearRange(2026.5, 2026)).toBe(false)
    expect(isInPrintYearRange(Number.NaN, 2026)).toBe(false)
  })
})

describe("printYearChoices", () => {
  it("범위의 연도를 오름차순으로 낸다", () => {
    expect(printYearChoices(2026)).toEqual([2021, 2022, 2023, 2024, 2025, 2026, 2027])
  })

  it("저장된 연도가 범위 밖이면 그 연도도 제자리에 끼워 넣는다(모르게 바뀌지 않게)", () => {
    expect(printYearChoices(2026, 2019)).toEqual([2019, 2021, 2022, 2023, 2024, 2025, 2026, 2027])
    expect(printYearChoices(2026, 2030)).toEqual([2021, 2022, 2023, 2024, 2025, 2026, 2027, 2030])
  })

  it("저장된 연도가 범위 안이거나 없으면 범위 그대로다", () => {
    expect(printYearChoices(2026, 2024)).toEqual(printYearChoices(2026))
    expect(printYearChoices(2026, undefined)).toEqual(printYearChoices(2026))
  })
})

describe("printYearError", () => {
  it("범위 안의 연도는 통과한다", () => {
    expect(printYearError(2021, 2026)).toBeUndefined()
    expect(printYearError(2027, 2026)).toBeUndefined()
  })

  it("범위 밖이나 숫자가 아닌 값은 범위를 적은 오류를 낸다", () => {
    expect(printYearError(2028, 2026)).toBe("연도는 2021~2027년 중에서 골라 주세요.")
    expect(printYearError(2020, 2026)).toBeDefined()
    expect(printYearError(Number.NaN, 2026)).toBeDefined()
  })

  it("범위 밖이어도 이미 저장된 연도와 같으면 통과한다", () => {
    expect(printYearError(2019, 2026, 2019)).toBeUndefined()
    expect(printYearError(2018, 2026, 2019)).toBeDefined()
  })
})

describe("kindHasYear · specYear", () => {
  it("월간·연간 달력만 연도가 있다", () => {
    expect(kindHasYear("monthly")).toBe(true)
    expect(kindHasYear("year-sheet")).toBe(true)
    expect(kindHasYear("season-poster")).toBe(false)
    expect(kindHasYear("month-poster")).toBe(false)
  })

  it("사양의 연도를 읽고, 연도가 없는 종류는 undefined다", () => {
    expect(specYear({ ...DEFAULT_SPECS.monthly, year: 2024 })).toBe(2024)
    expect(specYear(DEFAULT_SPECS["season-poster"])).toBeUndefined()
  })
})
