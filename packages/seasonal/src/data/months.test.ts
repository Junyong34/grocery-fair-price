import { describe, expect, it } from "vitest"

import { formatSeasonMonths } from "./months"

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
