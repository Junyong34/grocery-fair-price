import { describe, expect, it } from "vitest"

import { getAt, setAt } from "./spec-path"

describe("getAt", () => {
  it("경로를 따라 값을 읽고, 없는 경로는 undefined다", () => {
    const value = { calendar: { weekStart: 1 } }
    expect(getAt(value, ["calendar", "weekStart"])).toBe(1)
    expect(getAt(value, ["calendar", "missing", "deep"])).toBeUndefined()
  })
})

describe("setAt", () => {
  it("경로의 값만 바꾼 새 객체를 돌려주고 원본은 그대로다", () => {
    const value = { year: 2026, calendar: { weekStart: 0, weekday: "korean" } }
    const next = setAt(value, ["calendar", "weekStart"], 1)
    expect(next).toEqual({ year: 2026, calendar: { weekStart: 1, weekday: "korean" } })
    expect(value.calendar.weekStart).toBe(0)
    expect(next.year).toBe(2026)
  })

  it("빈 경로는 값 자체를 바꾼다", () => {
    expect(setAt({ a: 1 }, [], { b: 2 })).toEqual({ b: 2 })
  })
})
