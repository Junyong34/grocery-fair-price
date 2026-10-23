import { describe, expect, it } from "vitest"

import { monthFlow, printMonthLabel } from "./month-label"

describe("printMonthLabel", () => {
  it("숫자·두 자리·한글은 길이와 상관없이 같다", () => {
    expect(printMonthLabel(1, "number")).toEqual({ main: "1", kind: "number" })
    expect(printMonthLabel(1, "two-digit")).toEqual({ main: "01", kind: "number" })
    expect(printMonthLabel(12, "two-digit")).toEqual({ main: "12", kind: "number" })
    expect(printMonthLabel(9, "korean", { length: "short" })).toEqual({ main: "9월", kind: "text" })
  })

  it("영어 축약은 늘 세 글자, 풀네임은 좁은 자리(short)에서만 세 글자로 줄인다", () => {
    expect(printMonthLabel(9, "english-short").main).toBe("Sep")
    expect(printMonthLabel(9, "english-short-caps")).toEqual({ main: "SEP", kind: "caps" })
    expect(printMonthLabel(9, "english-full").main).toBe("September")
    expect(printMonthLabel(9, "english-full", { length: "short" }).main).toBe("Sep")
    expect(printMonthLabel(9, "english-full-caps", { length: "short" })).toEqual({ main: "SEP", kind: "caps" })
  })

  it("섞어 쓰는 표기는 작은 영문을 곁들이고, 좁은 자리에서는 큰 글자만 남긴다", () => {
    expect(printMonthLabel(1, "number-english")).toEqual({ main: "1", kind: "number", sub: { text: "JANUARY", kind: "caps" } })
    expect(printMonthLabel(11, "korean-english")).toEqual({ main: "11월", kind: "text", sub: { text: "NOV", kind: "caps" } })
    expect(printMonthLabel(11, "korean-english", { length: "short" })).toEqual({ main: "11월", kind: "text" })
  })

  it("책갈피 리본은 좁아서 네 글자 넘는 이름을 숫자로 바꾸고 이름은 아래로 내린다", () => {
    expect(printMonthLabel(9, "english-full", { frame: "ribbon" })).toEqual({ main: "9", kind: "number", sub: { text: "SEPTEMBER", kind: "caps" } })
    expect(printMonthLabel(9, "english-short", { frame: "ribbon" }).main).toBe("Sep")
  })

  it("외곽선은 숫자만 크게 쓰고, '월'을 떼서 아래 영문과 겹치지 않게 한다", () => {
    expect(printMonthLabel(11, "korean", { frame: "outline" })).toEqual({ main: "11", kind: "number", sub: { text: "November", kind: "text" } })
    expect(printMonthLabel(11, "korean-english", { frame: "outline" })).toEqual({ main: "11", kind: "number", sub: { text: "NOV", kind: "caps" } })
    expect(printMonthLabel(1, "two-digit", { frame: "outline" }).main).toBe("01")
  })
})

describe("monthFlow", () => {
  it("계절 가운데 달(1·4·7·10월)은 그 계절색 하나다", () => {
    expect(monthFlow(1)).toEqual({ from: "winter", to: "spring", weight: 100 })
    expect(monthFlow(4)).toEqual({ from: "spring", to: "summer", weight: 100 })
    expect(monthFlow(10)).toEqual({ from: "autumn", to: "winter", weight: 100 })
  })

  it("사이 달은 앞 계절에서 다음 계절로 3분의 1씩 옮겨 간다", () => {
    expect(monthFlow(2)).toEqual({ from: "winter", to: "spring", weight: 67 })
    expect(monthFlow(3)).toEqual({ from: "winter", to: "spring", weight: 33 })
    expect(monthFlow(12)).toEqual({ from: "autumn", to: "winter", weight: 33 })
  })
})
