import { describe, expect, it } from "vitest"

import { latestSurveyedOn, pickByIds } from "./list"

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
