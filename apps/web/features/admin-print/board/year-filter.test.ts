import { describe, expect, it } from "vitest"

import type { EditionSummary } from "../types"
import { ALL_YEARS, filterByYear, NO_YEAR, resolveYearFilter, yearFilterOptions } from "./year-filter"

const edition = (id: string, year: number | null): EditionSummary => ({
  id,
  kind: year === null ? "season-poster" : "monthly",
  title: id,
  status: "draft",
  currentBuildDate: null,
  year,
})

describe("yearFilterOptions", () => {
  it("전체 연도 다음에 있는 연도를 겹치지 않게 최근 것부터 놓는다", () => {
    const options = yearFilterOptions([edition("a", 2026), edition("b", 2027), edition("c", 2026), edition("d", 2025)])
    expect(options).toEqual([
      { value: ALL_YEARS, label: "전체 연도" },
      { value: "2027", label: "2027년" },
      { value: "2026", label: "2026년" },
      { value: "2025", label: "2025년" },
    ])
  })

  it("연도 없는 에디션이 있을 때만 연도 없음을 맨 뒤에 둔다", () => {
    expect(yearFilterOptions([edition("a", 2026), edition("p", null)]).map((option) => option.value)).toEqual([ALL_YEARS, "2026", NO_YEAR])
    expect(yearFilterOptions([]).map((option) => option.value)).toEqual([ALL_YEARS])
  })
})

describe("filterByYear", () => {
  const editions = [edition("a", 2026), edition("b", 2027), edition("p", null)]

  it("전체 연도면 모두 남긴다", () => {
    expect(filterByYear(editions, ALL_YEARS)).toEqual(editions)
  })

  it("고른 연도의 에디션만 남긴다", () => {
    expect(filterByYear(editions, "2026").map((e) => e.id)).toEqual(["a"])
  })

  it("연도 없음이면 연도 없는 에디션만 남긴다", () => {
    expect(filterByYear(editions, NO_YEAR).map((e) => e.id)).toEqual(["p"])
  })

  it("목록에 없는 연도면 아무것도 남지 않는다", () => {
    expect(filterByYear(editions, "2030")).toEqual([])
  })
})

describe("resolveYearFilter", () => {
  it("고른 값이 선택지에 없으면 전체 연도로 돌아간다", () => {
    const options = yearFilterOptions([edition("a", 2026)])
    expect(resolveYearFilter("2026", options)).toBe("2026")
    expect(resolveYearFilter("2030", options)).toBe(ALL_YEARS)
  })
})

