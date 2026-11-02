import { describe, expect, it } from "vitest"

import { festivalDate, festivalOf, FESTIVALS, festivalsWithFood } from "./festivals"

describe("festivalDate", () => {
  it("연도마다 다른 양력 날짜를 돌려준다", () => {
    // 추석·설날은 holidays-kr(관보)의 날짜와 같아야 한다.
    expect(festivalDate("chuseok", 2026)).toEqual({ year: 2026, month: 9, day: 25 })
    expect(festivalDate("chuseok", 2027)).toEqual({ year: 2027, month: 9, day: 15 })
    expect(festivalDate("seollal", 2027)).toEqual({ year: 2027, month: 2, day: 7 })
  })

  it("표에 없는 먼 연도도 계산한다", () => {
    expect(festivalDate("chuseok", 2028)).toEqual({ year: 2028, month: 10, day: 3 })
    expect(festivalDate("dongji", 2029)).toEqual({ year: 2029, month: 12, day: 21 })
  })

  it("하루로 정할 수 없는 삼복은 null이다", () => {
    expect(festivalDate("sambok", 2026)).toBeNull()
  })
})

describe("festivalsWithFood", () => {
  it("그 무렵 제철 품종으로 그 품종을 꼽은 명절을 고른다", () => {
    expect(festivalsWithFood("gizzard-shad").map((f) => f.slug)).toEqual(["chuseok"])
    expect(festivalsWithFood("watermelon").map((f) => f.slug)).toEqual(["sambok"])
    expect(festivalsWithFood("persimmon")).toEqual([])
  })
})

describe("festivalOf", () => {
  it("slug로 그 명절을 찾는다", () => {
    for (const festival of FESTIVALS) expect(festivalOf(festival.slug)).toBe(festival)
  })
})
