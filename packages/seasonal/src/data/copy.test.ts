import { describe, expect, it } from "vitest"

import { MONTH_CATEGORY_COPY, MY_TABLE_COPY, SASHIMI_COPY } from "./copy"
import { MONTHS } from "./months"
import { SASHIMI_MONTHS, sashimiInMonth } from "./sashimi"

describe("나의 식탁 검색 안내", () => {
  it("검색 결과 없음과 선택 조건 안의 결과 없음을 구분한다", () => {
    expect(MY_TABLE_COPY.emptyTitle(" ㄹㅇㅁ ", false)).toBe(
      '"ㄹㅇㅁ" 검색 결과가 없어요'
    )
    expect(MY_TABLE_COPY.emptyTitle("굴", true)).toBe(
      '선택한 조건에서 "굴"을 찾지 못했어요'
    )
    expect(MY_TABLE_COPY.emptyTitle("  ", true)).toBe(
      "선택한 조건에 맞는 품종이 없어요"
    )
  })

  it("결과 수에 시기·카테고리·검색어와 먹음 기록 수를 함께 표시한다", () => {
    expect(MY_TABLE_COPY.listResult("11월", "수산", "굴", 1, 1)).toBe(
      '11월 · 수산 · "굴" 검색 결과 1가지 · 먹음 1가지'
    )
    expect(MY_TABLE_COPY.listResult(null, "버섯", "", 5, 0)).toBe(
      "전체 시기 · 버섯 5가지 · 먹음 0가지"
    )
    expect(MY_TABLE_COPY.listResult("1월", "버섯", "", 0, 0)).toBe(
      "1월 · 버섯 0가지 · 먹음 0가지"
    )
  })
})

describe("제철 회 문구", () => {
  it("회 화면의 모든 품종에 한 줄 설명이 있다", () => {
    for (const month of MONTHS)
      for (const food of sashimiInMonth(month))
        expect(SASHIMI_COPY.descriptions[food.id], food.id).toBeTruthy()
  })

  it("회 품종이 아닌 설명은 없다", () => {
    const ids = new Set(Object.values(SASHIMI_MONTHS).flat())
    for (const id of Object.keys(SASHIMI_COPY.descriptions))
      expect(ids.has(id as never), id).toBe(true)
  })

  it("달 제목과 설명에 숫자를 쓰지 않는다(품종 수는 화면이 따로 센다)", () => {
    for (const text of [
      ...Object.values(SASHIMI_COPY.monthTitles),
      ...Object.values(SASHIMI_COPY.descriptions),
    ])
      expect(text).not.toMatch(/\d/)
  })

  it("설명은 카드 한 줄에 들어가게 20자 이하다", () => {
    for (const [id, text] of Object.entries(SASHIMI_COPY.descriptions))
      expect(text.length, id).toBeLessThanOrEqual(20)
  })

  it("품종 수 표시", () => {
    expect(SASHIMI_COPY.count(6)).toBe("6종")
  })
})

describe("월별 카테고리 소제목", () => {
  it("소제목과 첫 문장", () => {
    expect(MONTH_CATEGORY_COPY.heading(11, "수산")).toBe("11월 제철 생선·해산물")
    expect(MONTH_CATEGORY_COPY.lead(11, "수산", ["방어", "굴", "광어"], 12)).toBe("11월에 제철인 생선·해산물은 방어·굴·광어 등 12가지예요.")
    expect(MONTH_CATEGORY_COPY.lead(11, "버섯", ["표고", "느타리"], 2)).toBe("11월에 제철인 버섯은 표고·느타리 2가지예요.")
    expect(MONTH_CATEGORY_COPY.lead(11, "채소", ["배추", "무", "시금치"], 3)).toBe("11월에 제철인 채소는 배추·무·시금치 3가지예요.")
  })
})
