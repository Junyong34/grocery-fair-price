import { describe, expect, it } from "vitest"

import { festivalDate } from "./festivals"

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
