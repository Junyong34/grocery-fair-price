import { describe, expect, it } from "vitest"

import { formatMonthLabel, formatSeasonMonths } from "./months"

describe("formatSeasonMonths", () => {
  it("제철 달을 가운뎃점으로 이어 적는다", () => {
    expect(formatSeasonMonths([9, 10])).toBe("제철 9·10월")
  })

  it("해를 넘는 제철은 늦가을·겨울부터 이어 적는다", () => {
    expect(formatSeasonMonths([1, 2, 11, 12])).toBe("제철 11·12·1·2월")
    expect(formatSeasonMonths([1, 2, 3, 4, 12])).toBe("제철 12·1·2·3·4월")
  })

  it("떨어진 두 구간은 빈 달이 가장 긴 곳에서 끊는다", () => {
    // 재첩: 봄(4~6월)과 가을(9~11월). 빈 구간은 7~8월(2개월)과 12~3월(4개월)이다.
    expect(formatSeasonMonths([4, 5, 6, 9, 10, 11])).toBe("제철 4·5·6·9·10·11월")
  })
})

describe("formatMonthLabel", () => {
  it("숫자만, 한글(1월), 영어 약자로 적는다", () => {
    expect(formatMonthLabel(1, "number")).toBe("1")
    expect(formatMonthLabel(1, "korean")).toBe("1월")
    expect(formatMonthLabel(1, "english")).toBe("Jan")
  })

  it("영어는 열두 달 모두 세 글자 약자다", () => {
    const labels = Array.from({ length: 12 }, (_, i) => formatMonthLabel(i + 1, "english"))
    expect(labels).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])
  })

  it("long은 영어 전체 이름으로 적고, 숫자·한글은 그대로다", () => {
    expect(formatMonthLabel(9, "english", "long")).toBe("September")
    expect(formatMonthLabel(5, "english", "long")).toBe("May")
    expect(formatMonthLabel(9, "korean", "long")).toBe("9월")
    expect(formatMonthLabel(9, "number", "long")).toBe("9")
  })
})
