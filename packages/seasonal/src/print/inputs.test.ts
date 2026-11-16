import { describe, expect, it } from "vitest"

import { PRINT_DATA_MODULES, printDataHash } from "./inputs"
import { DEFAULT_SPECS, PRINT_KINDS } from "./spec"

describe("printDataHash", () => {
  it("인쇄물 종류마다 같은 데이터면 같은 8자리 16진수다", () => {
    for (const kind of PRINT_KINDS) {
      const spec = DEFAULT_SPECS[kind]
      expect(printDataHash(spec)).toMatch(/^[0-9a-f]{8}$/)
      expect(printDataHash(spec)).toBe(printDataHash(spec))
    }
  })

  it("이유식 인쇄물도 그리는 데이터로 해시를 만든다(빼지 않는다)", () => {
    const pairings = printDataHash(DEFAULT_SPECS["baby-food-pairings"])
    const fruits = printDataHash(DEFAULT_SPECS["baby-food-fruits"])
    expect(pairings).not.toBe(fruits)
    expect(PRINT_DATA_MODULES["baby-food-fruits"]).toContain("data/infant-fruits")
    expect(PRINT_DATA_MODULES["baby-food-pairings"]).toContain("data/infant-pairings")
  })

  it("공휴일은 그 해 것만 넣어서, 해가 다르면 해시도 다르다", () => {
    const spec = DEFAULT_SPECS.monthly
    expect(PRINT_DATA_MODULES.monthly).toContain("calendar/holidays")
    expect(printDataHash({ ...spec, year: spec.year + 1 })).not.toBe(printDataHash(spec))
  })

  it("Set으로 된 데이터(친숙도 등급)도 내용이 해시에 들어간다", () => {
    expect(PRINT_DATA_MODULES.monthly).toContain("data/food-familiarity")
    expect(PRINT_DATA_MODULES.monthly).toContain("data/food-sizes")
  })
})
