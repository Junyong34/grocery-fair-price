import { describe, expect, it } from "vitest"

import { monthDays, nextMonthDay } from "./month-days"

const pick = (month: number, year: number) =>
  monthDays(month, year).map((day) => `${day.name} ${day.date.month}.${day.date.day}`)

describe("monthDays", () => {
  it("복날은 하지 뒤 셋째·넷째 경일(초복·중복)과 입추 뒤 첫 경일(말복)이다", () => {
    expect(pick(7, 2024)).toEqual(["초복 7.15", "중복 7.25"])
    expect(pick(8, 2024)).toEqual(["입추 8.7", "칠석 8.10", "말복 8.14", "처서 8.22"])
    expect(pick(7, 2025)).toEqual(["초복 7.20", "중복 7.30"])
    expect(monthDays(8, 2025).find((day) => day.id === "malbok")?.date).toEqual({ year: 2025, month: 8, day: 9 })
    // 2019 하지(6.22)는 그날이 경일이라 하지 당일부터 센다.
    expect(pick(7, 2019)).toEqual(["초복 7.12", "중복 7.22"])
  })

  it("한식은 동지 다음 날부터 105일째다", () => {
    expect(monthDays(4, 2024).find((day) => day.id === "hansik")?.date).toEqual({ year: 2024, month: 4, day: 5 })
    expect(monthDays(4, 2026).find((day) => day.id === "hansik")?.date).toEqual({ year: 2026, month: 4, day: 6 })
  })

  it("명절과 절기를 날짜 순으로 섞는다. 날짜가 없는 명절(삼복)은 복날 줄이 대신한다", () => {
    expect(pick(2, 2026)).toEqual(["입춘 2.4", "설날 2.17"])
    // 정월대보름은 해에 따라 달이 바뀐다(2026년 3월 3일, 2027년 2월 21일).
    expect(pick(3, 2026)).toContain("정월대보름 3.3")
    expect(pick(2, 2027)).toContain("정월대보름 2.21")
    expect(pick(6, 2026)).toEqual(["단오 6.19", "하지 6.21"])
    expect(monthDays(7, 2026).every((day) => day.id !== "sambok")).toBe(true)
    expect(monthDays(7, 2026).find((day) => day.id === "chobok")?.festival).toBe("sambok")
    expect(monthDays(12, 2026).map((day) => day.name)).toEqual(["동지"])
  })

  it("종류를 붙인다", () => {
    const kinds = Object.fromEntries(monthDays(2, 2026).map((day) => [day.name, day.kind]))
    expect(kinds).toEqual({ 입춘: "solar-term", 설날: "festival" })
    expect(monthDays(7, 2026)[0]!.kind).toBe("custom")
  })

  it("큰 날이 없는 달도 있다", () => {
    expect(monthDays(10, 2026)).toEqual([])
  })
})

describe("nextMonthDay", () => {
  it("그 달 뒤 가장 가까운 날을 찾는다. 해가 넘어가면 다음 해에서 찾는다", () => {
    expect(nextMonthDay(10, 2026)?.name).toBe("입동")
    expect(nextMonthDay(12, 2026)?.date).toEqual({ year: 2027, month: 1, day: 5 })
  })
})
