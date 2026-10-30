import { describe, expect, it } from "vitest"

import { basisLine, brandSpreadNote, listBasisLine, partOfMonth, PRICE_COPY, seasonNote, seasonVerdictNote, verdictChip, verdictDiff, withJosa } from "./copy"

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

describe("계절 문구", () => {
  it("날짜를 달의 초 · 중순 · 말로 쓴다", () => {
    expect(partOfMonth("2026-10-05")).toBe("10월 초")
    expect(partOfMonth("2026-10-20")).toBe("10월 중순")
    expect(partOfMonth("2026-10-28")).toBe("10월 말")
  })

  it("계절비율로 이맘때가 한 해 중 비싼 때인지 싼 때인지 쓴다", () => {
    expect(seasonNote(1.12, "2026-10-28")).toBe("10월 말엔 한 해 평소보다 12% 비싼 때예요")
    expect(seasonNote(0.85, "2026-06-03")).toBe("6월 초엔 한 해 평소보다 15% 싼 때예요")
    expect(seasonNote(1.03, "2026-03-15")).toBe("3월 중순엔 한 해 중 가격이 평소와 비슷한 때예요")
  })

  it("싸요 · 비싸요는 계절 말고 다른 이유가 있다고 쓰고, 날씨는 단정하지 않는다", () => {
    expect(seasonVerdictNote({ kind: "pricey", pct: 18 }, 1.1)).toBe(
      "계절을 감안해도 평소보다 18% 높아요. 날씨 · 작황 · 수입량처럼 계절 말고 다른 이유가 있을 수 있어요",
    )
    expect(seasonVerdictNote({ kind: "cheap", pct: -14 }, 0.9)).toBe("계절을 감안해도 평소보다 14% 낮아요. 물량이 많은 때일 수 있어요")
  })

  it("보통이면 계절이 가격을 설명할 때만 한 줄 붙인다", () => {
    expect(seasonVerdictNote({ kind: "normal", pct: 4 }, 1.12)).toBe("비싸 보여도 이맘때 오르는 만큼 오른 가격이에요")
    expect(seasonVerdictNote({ kind: "normal", pct: -3 }, 0.88)).toBe("이맘때 내리는 만큼 내린 가격이에요")
    expect(seasonVerdictNote({ kind: "normal", pct: 1 }, 1.02)).toBeNull()
    expect(seasonVerdictNote({ kind: "none", pct: null }, 1.2)).toBeNull()
  })
})

describe("브랜드 편차 안내", () => {
  it("판정은 흐름을 보는 참고라고 한 줄로 쓴다", () => {
    expect(brandSpreadNote("쌀")).toBe("쌀은 품종 · 브랜드 · 도정일마다 값이 꽤 달라요. 판정은 쌀값 흐름을 보는 참고로 봐 주세요")
    expect(brandSpreadNote("현미")).toBe("현미는 품종 · 브랜드 · 도정일마다 값이 꽤 달라요. 판정은 현미값 흐름을 보는 참고로 봐 주세요")
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

describe("listBasisLine", () => {
  const kamis = { source: "KAMIS", scope: "전국 조사 시장" }
  const ekape = { source: "축평원", scope: "전국 평균" }

  it("가장 최근 조사일과 출처 하나", () => {
    expect(listBasisLine([{ surveyedOn: "2026-10-23", basis: kamis }, { surveyedOn: "2026-10-29", basis: kamis }])).toBe(
      "시세는 10/29 조사 · KAMIS 전국 조사 시장"
    )
  })

  it("출처가 여럿이면 처음 나온 순서대로 한 번씩 쓴다", () => {
    const rows = [
      { surveyedOn: "2026-10-29", basis: kamis },
      { surveyedOn: "2026-10-28", basis: ekape },
      { surveyedOn: "2026-10-29", basis: kamis },
    ]
    expect(listBasisLine(rows)).toBe("시세는 10/29 조사 · KAMIS 전국 조사 시장 · 축평원 전국 평균")
  })

  it("빈 목록이면 null", () => {
    expect(listBasisLine([])).toBeNull()
  })
})

describe("검색 문구", () => {
  it("따옴표 밖에 조사를 붙인다", () => {
    expect(PRICE_COPY.search.noResult("트러플")).toBe('"트러플"은 아직 판정하지 않아요')
    expect(PRICE_COPY.search.alias("대패삼겹")).toBe('"대패삼겹"은 이 품종으로 찾았어요')
    expect(PRICE_COPY.toast.added("배추")).toBe("배추를 담았어요")
  })
})
