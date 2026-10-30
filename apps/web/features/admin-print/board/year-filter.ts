import type { EditionSummary } from "../types"

/** 연도 필터 값. 연도는 문자열("2026")로, 두 특별한 값은 아래 상수로 적는다. select 값과 그대로 맞물린다. */
export const ALL_YEARS = "all"
export const NO_YEAR = "none"

export type YearFilter = string

export type YearFilterOption = { value: YearFilter; label: string }

/** 전체 연도 + 목록에 있는 연도(최근 것부터) + 연도 없는 에디션(포스터)이 있으면 연도 없음. */
export function yearFilterOptions(editions: readonly EditionSummary[]): YearFilterOption[] {
  const years = [...new Set(editions.flatMap((edition) => (edition.year === null ? [] : [edition.year])))].sort((a, b) => b - a)
  const hasYearless = editions.some((edition) => edition.year === null)
  return [
    { value: ALL_YEARS, label: "전체 연도" },
    ...years.map((year) => ({ value: String(year), label: `${year}년` })),
    ...(hasYearless ? [{ value: NO_YEAR, label: "연도 없음" }] : []),
  ]
}

/** 종류로 나누기 전에 거른다. 그래야 탭의 개수가 고른 연도를 따른다. */
export function filterByYear(editions: readonly EditionSummary[], filter: YearFilter): EditionSummary[] {
  if (filter === ALL_YEARS) return [...editions]
  if (filter === NO_YEAR) return editions.filter((edition) => edition.year === null)
  return editions.filter((edition) => edition.year !== null && String(edition.year) === filter)
}

/** 에디션을 지워 고른 연도가 선택지에서 사라지면 전체 연도로 돌아간다. */
export function resolveYearFilter(filter: YearFilter, options: readonly YearFilterOption[]): YearFilter {
  return options.some((option) => option.value === filter) ? filter : ALL_YEARS
}
