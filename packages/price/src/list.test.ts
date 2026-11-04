import { describe, expect, it } from "vitest"

import { groupByCategory, latestSurveyedOn, pickByIds } from "./list"

const row = (id: string, surveyedOn: string) => ({ id, surveyedOn })

describe("latestSurveyedOn", () => {
  it("가장 최근 조사일", () => {
    expect(latestSurveyedOn([row("a", "2026-10-09"), row("b", "2026-10-23"), row("c", "2026-10-20")])).toBe("2026-10-23")
  })

  it("빈 목록이면 null", () => {
    expect(latestSurveyedOn([])).toBeNull()
  })
})

describe("pickByIds", () => {
  it("id 순서대로 고르고 없는 id는 건너뛴다", () => {
    const rows = [row("a", ""), row("b", ""), row("c", "")]
    expect(pickByIds(rows, ["c", "x", "a"]).map((r) => r.id)).toEqual(["c", "a"])
  })
})

describe("groupByCategory", () => {
  it("목록 순서를 지켜 카테고리별로 묶는다(카테고리는 처음 나온 순서)", () => {
    const rows = [
      { id: "a", category: "채소" },
      { id: "b", category: "과일" },
      { id: "c", category: "채소" },
    ]
    expect(groupByCategory(rows)).toEqual([
      { category: "채소", rows: [rows[0], rows[2]] },
      { category: "과일", rows: [rows[1]] },
    ])
  })

  it("빈 목록이면 빈 배열", () => {
    expect(groupByCategory([])).toEqual([])
  })
})
