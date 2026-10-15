import { describe, expect, it } from "vitest"

import { holidaysInMonth } from "./holidays"

describe("holidaysInMonth", () => {
  it("12월 25일은 법정 이름(기독탄신일) 대신 크리스마스로 적는다", () => {
    expect(holidaysInMonth(2026, 12)[25]).toEqual(["크리스마스"])
  })

  it("다른 공휴일 이름은 그대로 둔다", () => {
    expect(holidaysInMonth(2026, 5)[5]).toEqual(["어린이날"])
  })
})
