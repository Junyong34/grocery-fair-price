import { describe, expect, it } from "vitest"

import {
  brandSpreadNote,
  listBasisLine,
  listSourceLine,
  partOfMonth,
  PRICE_COPY,
  summaryLine,
  seasonNote,
  seasonVerdictNote,
  verdictChip,
  verdictDiff,
  verdictTrendDiff,
  withJosa,
} from "./copy"

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

  it("수집된 판정의 차이는 당일 가격이 아닌 최근 조사 기준임을 밝힌다", () => {
    expect(verdictTrendDiff(8)).toBe("최근 조사 결과를 보면 평소보다 8% 높아요")
    expect(verdictTrendDiff(-15)).toBe("최근 조사 결과를 보면 평소보다 15% 낮아요")
    expect(verdictTrendDiff(0)).toBe("최근 조사 결과를 보면 평소와 같아요")
  })
})

describe("계절 문구", () => {
  it("날짜를 달의 초 · 중순 · 말로 쓴다", () => {
    expect(partOfMonth("2026-10-05")).toBe("10월 초")
    expect(partOfMonth("2026-10-20")).toBe("10월 중순")
    expect(partOfMonth("2026-10-28")).toBe("10월 말")
  })

  it("계절비율로 이맘때가 한 해 중 비싼 때인지 싼 때인지 쓴다", () => {
    expect(seasonNote(1.12, "2026-10-28")).toBe(
      "10월 말엔 한 해 평소보다 12% 비싼 때예요"
    )
    expect(seasonNote(0.85, "2026-06-03")).toBe(
      "6월 초엔 한 해 평소보다 15% 싼 때예요"
    )
    expect(seasonNote(1.03, "2026-03-15")).toBe(
      "3월 중순엔 한 해 중 가격이 평소와 비슷한 때예요"
    )
  })

  it("싸요 · 비싸요는 계절 말고 다른 이유가 있다고 쓰고, 날씨는 단정하지 않는다", () => {
    expect(seasonVerdictNote({ kind: "pricey", pct: 18 }, 1.1)).toBe(
      "계절을 감안해도 평소보다 18% 높아요. 날씨 · 작황 · 수입량처럼 계절 말고 다른 이유가 있을 수 있어요"
    )
    expect(seasonVerdictNote({ kind: "cheap", pct: -14 }, 0.9)).toBe(
      "계절을 감안해도 평소보다 14% 낮아요. 물량이 많은 때일 수 있어요"
    )
  })

  it("보통이면 계절이 가격을 설명할 때만 한 줄 붙인다", () => {
    expect(seasonVerdictNote({ kind: "normal", pct: 4 }, 1.12)).toBe(
      "비싸 보여도 이맘때 오르는 만큼 오른 가격이에요"
    )
    expect(seasonVerdictNote({ kind: "normal", pct: -3 }, 0.88)).toBe(
      "이맘때 내리는 만큼 내린 가격이에요"
    )
    expect(seasonVerdictNote({ kind: "normal", pct: 1 }, 1.02)).toBeNull()
    expect(seasonVerdictNote({ kind: "none", pct: null }, 1.2)).toBeNull()
  })
})

describe("브랜드 편차 안내", () => {
  it("판정은 흐름을 보는 참고라고 한 줄로 쓴다", () => {
    expect(brandSpreadNote("쌀")).toBe(
      "쌀은 품종 · 브랜드 · 도정일마다 값이 꽤 달라요. 판정은 쌀값 흐름을 보는 참고로 봐 주세요"
    )
    expect(brandSpreadNote("현미")).toBe(
      "현미는 품종 · 브랜드 · 도정일마다 값이 꽤 달라요. 판정은 현미값 흐름을 보는 참고로 봐 주세요"
    )
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

describe("summaryLine", () => {
  const kamis = { source: "KAMIS", scope: "전국 조사 시장" }
  const base = { name: "녹두", baseUnit: "100g", price: 2700, usual: 2480, surveyedOn: "2026-11-03", sampleSize: 40, basis: kamis }

  it("날짜(연도 포함)·출처·표본·시세·평소가·판정을 한 문장으로 쓴다", () => {
    expect(summaryLine({ ...base, verdict: { kind: "pricey", pct: 9 } })).toBe(
      "2026년 11월 3일 KAMIS 전국 조사 시장 40곳 중간값 기준, 녹두 100g 시세는 2,700원이에요. 평소가는 2,480원이에요. 최근 조사 결과를 보면 평소보다 9% 높아 비싸요."
    )
  })

  it("싸요 · 같은 값", () => {
    expect(summaryLine({ ...base, verdict: { kind: "cheap", pct: -12 } })).toContain("평소보다 12% 낮아 싸요.")
    expect(summaryLine({ ...base, verdict: { kind: "normal", pct: 0 } })).toContain("평소와 같아 보통이에요.")
  })

  it("판정 전이면 평소가가 없다고 쓴다", () => {
    expect(summaryLine({ ...base, usual: null, verdict: { kind: "none", pct: null } })).toBe(
      "2026년 11월 3일 KAMIS 전국 조사 시장 40곳 중간값 기준, 녹두 100g 시세는 2,700원이에요. 평소가가 아직 쌓이지 않아 판정 전이에요."
    )
  })

  it("전국 평균(축평원)은 곳 수와 중간값을 쓰지 않는다", () => {
    expect(
      summaryLine({ ...base, name: "계란", baseUnit: "30구", price: 6998, usual: null, sampleSize: 1, basis: { source: "축평원", scope: "전국 평균" }, verdict: { kind: "none", pct: null } })
    ).toMatch(/^2026년 11월 3일 축평원 전국 평균 기준, 계란 30구 시세는 6,998원이에요\./)
  })
})

describe("nowPriceNote", () => {
  it("조사 시장 가격은 곳 수와 중간값으로 쓴다", () => {
    expect(PRICE_COPY.detail.nowPriceNote("2026-11-03", 40, { source: "KAMIS", scope: "전국 조사 시장" })).toBe("11/3 조사한 40곳 가격의 중간값")
  })

  it("범위 제목과 점선 설명도 전국 평균이면 곳 수·중간값을 쓰지 않는다", () => {
    const ekape = { source: "축평원", scope: "전국 평균" }
    const kamis = { source: "KAMIS", scope: "전국 조사 시장" }
    expect(PRICE_COPY.detail.rangeTitle("2026-11-03", 1, ekape)).toBe("11/3 조사한 전국 평균 가격")
    expect(PRICE_COPY.detail.rangeTitle("2026-11-03", 40, kamis)).toBe("11/3 조사한 40곳의 시세 범위")
    expect(PRICE_COPY.detail.rangePin("6,998", ekape)).toBe("전국 평균 6,998원")
    expect(PRICE_COPY.detail.rangePin("827", kamis)).toBe("시세 827원")
    expect(PRICE_COPY.detail.placesNote("6,998", ekape)).toBe("막대의 점선은 전국 평균(6,998원). 매장에서 본 가격을 여기 견주어 보세요.")
    expect(PRICE_COPY.detail.placesNote("827", kamis)).toBe("막대의 점선은 전국 중간값(827원). 매장에서 본 가격을 여기 견주어 보세요.")
  })

  it("전국 평균 한 건은 중간값이라 하지 않는다", () => {
    expect(PRICE_COPY.detail.nowPriceNote("2026-11-03", 1, { source: "축평원", scope: "전국 평균" })).toBe("11/3 조사한 전국 평균 가격")
  })
})

describe("listBasisLine", () => {
  const kamis = { source: "KAMIS", scope: "전국 조사 시장" }
  const ekape = { source: "축평원", scope: "전국 평균" }

  it("조사일이 다르면 가장 오래된 날부터 최근 날까지 표시한다", () => {
    expect(
      listBasisLine([
        { surveyedOn: "2026-10-23", basis: kamis },
        { surveyedOn: "2026-10-29", basis: kamis },
      ])
    ).toBe("조사일 10/23~10/29 · KAMIS 전국 조사 시장")
  })

  it("출처가 여럿이면 처음 나온 순서대로 한 번씩 쓴다", () => {
    const rows = [
      { surveyedOn: "2026-10-29", basis: kamis },
      { surveyedOn: "2026-10-28", basis: ekape },
      { surveyedOn: "2026-10-29", basis: kamis },
    ]
    expect(listBasisLine(rows)).toBe(
      "조사일 10/28~10/29 · KAMIS 전국 조사 시장 · 축평원 전국 평균"
    )
  })

  it("모든 품종의 조사일이 같으면 그 날짜만 표시한다", () => {
    expect(
      listBasisLine([
        { surveyedOn: "2026-11-02", basis: kamis },
        { surveyedOn: "2026-11-02", basis: ekape },
      ])
    ).toBe("조사일 11/2 · KAMIS 전국 조사 시장 · 축평원 전국 평균")
  })

  it("빈 목록이면 null", () => {
    expect(listBasisLine([])).toBeNull()
  })
})

describe("목록의 짧은 출처", () => {
  it("날짜와 조사 범위를 빼고 출처 이름만 중복 없이 표시한다", () => {
    expect(
      listSourceLine([
        { basis: { source: "KAMIS", scope: "전국 조사 시장" } },
        { basis: { source: "축평원", scope: "전국 평균" } },
        { basis: { source: "KAMIS", scope: "대형마트" } },
      ])
    ).toBe("출처: KAMIS · 축평원")
  })

  it("출처가 하나면 구분자 없이 표시하고 빈 목록이면 숨긴다", () => {
    expect(
      listSourceLine([{ basis: { source: "KAMIS", scope: "전국 조사 시장" } }])
    ).toBe("출처: KAMIS")
    expect(listSourceLine([])).toBeNull()
  })
})

describe("검색 문구", () => {
  it("결과가 없으면 판정이 아니라 찾는 품종 목록에 없다고 말한다", () => {
    expect(PRICE_COPY.search.noResult("트러플")).toBe(
      '"트러플" 검색 결과가 없어요'
    )
    expect(PRICE_COPY.search.noResultHint.join(" ")).not.toContain("판정")
  })

  it("따옴표 밖에 조사를 붙인다", () => {
    expect(PRICE_COPY.search.alias("대패삼겹")).toBe(
      '"대패삼겹"은 이 이름으로 찾았어요'
    )
    expect(PRICE_COPY.toast.added("배추")).toBe("배추를 담았어요")
  })
})

describe("summaryLine 이름과 단위", () => {
  it("이름에 괄호가 있어도 단위를 괄호 밖에 써서 괄호가 겹치지 않는다", () => {
    expect(
      summaryLine({ name: "고등어(국산)", baseUnit: "1개", price: 3990, usual: 4562, verdict: { kind: "cheap", pct: -13 }, surveyedOn: "2026-11-04", sampleSize: 37, basis: { source: "KAMIS", scope: "전국 조사 시장" } })
    ).toContain("고등어(국산) 1개 시세는 3,990원이에요.")
  })
})
