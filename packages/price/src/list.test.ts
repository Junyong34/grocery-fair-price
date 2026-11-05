import { describe, expect, it } from "vitest"

import { latestSurveyedOn, pickByIds, relatedInCategory } from "./list"

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

describe("relatedInCategory", () => {
  const rows = [
    { id: "a", category: "채소" },
    { id: "x", category: "과일" },
    { id: "b", category: "채소" },
    { id: "c", category: "채소" },
    { id: "d", category: "채소" },
  ]

  it("같은 카테고리에서 그 품종 다음 것부터 돌아가며 고르고 자기 자신은 뺀다", () => {
    expect(relatedInCategory(rows, "c", 2).map((r) => r.id)).toEqual(["d", "a"])
    expect(relatedInCategory(rows, "a", 10).map((r) => r.id)).toEqual(["b", "c", "d"])
  })

  it("같은 카테고리에 다른 품종이 없거나 목록에 없는 id면 빈 배열", () => {
    expect(relatedInCategory(rows, "x", 3)).toEqual([])
    expect(relatedInCategory(rows, "nope", 3)).toEqual([])
  })
})
