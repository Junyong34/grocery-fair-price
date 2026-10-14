import { describe, expect, it } from "vitest"

import { festivalDate, festivalsInMonth } from "./festivals"

describe("festivalDate", () => {
  it("연도마다 다른 양력 날짜를 돌려준다", () => {
    // 추석·설날은 holidays-kr(관보)의 날짜와 같아야 한다.
    expect(festivalDate("chuseok", 2026)).toEqual({ year: 2026, month: 9, day: 25 })
    expect(festivalDate("chuseok", 2027)).toEqual({ year: 2027, month: 9, day: 15 })
    expect(festivalDate("seollal", 2027)).toEqual({ year: 2027, month: 2, day: 7 })
  })

  it("날짜 표에 없는 연도는 null이다", () => {
    expect(festivalDate("chuseok", 2028)).toBeNull()
  })
})

describe("festivalsInMonth", () => {
  it("그해 양력 날짜가 든 달의 명절을 고른다", () => {
    // 정월대보름은 2026년엔 3월 3일, 2027년엔 2월 21일이다.
    expect(festivalsInMonth(3, 2026).map((f) => f.slug)).toEqual(["daeboreum"])
    expect(festivalsInMonth(2, 2027).map((f) => f.slug)).toEqual(["seollal", "daeboreum"])
    expect(festivalsInMonth(10, 2026)).toEqual([])
  })

  it("날짜를 하루로 정할 수 없는 명절(삼복)과 표에 없는 연도는 대표 달에 둔다", () => {
    expect(festivalsInMonth(7, 2026).map((f) => f.slug)).toEqual(["sambok"])
    expect(festivalsInMonth(9, 2030).map((f) => f.slug)).toEqual(["chuseok"])
  })
})
