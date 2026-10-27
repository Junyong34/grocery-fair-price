import { describe, expect, it } from "vitest"

import { basisLine, PRICE_COPY, verdictChip, verdictDiff, withJosa } from "./copy"

describe("판정 문구", () => {
  it("칩은 판정과 %를 함께 쓴다", () => {
    expect(verdictChip({ kind: "normal", pct: 8 })).toBe("보통 +8%")
    expect(verdictChip({ kind: "cheap", pct: -15 })).toBe("싸요 -15%")
    expect(verdictChip({ kind: "none", pct: null })).toBe("판정 전")
  })

  it("평소보다 얼마나", () => {
    expect(verdictDiff(8)).toBe("평소보다 8% 높아요")
    expect(verdictDiff(-15)).toBe("평소보다 15% 낮아요")
    expect(verdictDiff(0)).toBe("평소와 같아요")
  })
})

describe("withJosa", () => {
  it("받침에 맞는 조사를 붙인다", () => {
    expect(withJosa("배추", "을/를")).toBe("배추를")
    expect(withJosa("트러플", "은/는")).toBe("트러플은")
  })

  it("괄호 앞 글자로 고른다", () => {
    expect(withJosa("삼겹살(국산)", "을/를")).toBe("삼겹살(국산)을")
    expect(withJosa("깐마늘(국산)", "은/는")).toBe("깐마늘(국산)은")
  })
})

describe("basisLine", () => {
  it("근거 한 줄", () => {
    expect(basisLine({ source: "KAMIS", scope: "전국 조사 시장" }, "2026-10-23", 45)).toBe(
      "전국 조사 시장 45곳 · 10/23 조사 (KAMIS)"
    )
  })
})

describe("검색 문구", () => {
  it("따옴표 밖에 조사를 붙인다", () => {
    expect(PRICE_COPY.search.noResult("트러플")).toBe('"트러플"은 아직 판정하지 않아요')
    expect(PRICE_COPY.search.alias("대패삼겹")).toBe('"대패삼겹"은 이 품종으로 찾았어요')
    expect(PRICE_COPY.toast.added("배추")).toBe("배추를 담았어요")
  })
})
