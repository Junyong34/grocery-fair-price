import { describe, expect, it } from "vitest"

import { MY_TABLE_COPY } from "./copy"

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
