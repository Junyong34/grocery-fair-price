import { describe, expect, it } from "vitest"

import {
  listBasisLine,
  listSourceLine,
  PRICE_COPY,
  verdictChip,
  verdictDiff,
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

