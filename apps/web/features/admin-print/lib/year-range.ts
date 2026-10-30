import { DEFAULT_SPECS, type PrintKind, type PrintSpec } from "@workspace/seasonal/print/spec"

// 어드민에서 고를 수 있는 달력 연도. 올해(서울 기준, 서버가 넘긴 값) 기준 5년 전부터 1년 뒤까지다.
// 범위가 오늘에 따라 움직이므로 사양 스키마(packages/seasonal)는 넓게 두고, 고르는 자리(새 에디션·편집기·서버 저장)에서만 막는다.
// 그래서 예전에 저장한 범위 밖 연도도 그대로 읽히고, 고치지 않는 한 그 값으로 남는다.

const YEARS_BACK = 5
const YEARS_AHEAD = 1

export function printYearRange(currentYear: number): { min: number; max: number } {
  return { min: currentYear - YEARS_BACK, max: currentYear + YEARS_AHEAD }
}

export function isInPrintYearRange(year: number, currentYear: number): boolean {
  const { min, max } = printYearRange(currentYear)
  return Number.isInteger(year) && year >= min && year <= max
}

/** 연도 선택지(오름차순). keep(이미 저장된 연도)이 범위 밖이면 그것도 넣어, 선택지에 없어 모르게 바뀌는 일이 없게 한다. */
export function printYearChoices(currentYear: number, keep?: number): number[] {
  const { min, max } = printYearRange(currentYear)
  const years = Array.from({ length: max - min + 1 }, (_, index) => min + index)
  if (keep === undefined || years.includes(keep)) return years
  return [...years, keep].sort((a, b) => a - b)
}

/** 서버가 저장 전에 보는 검사. 범위 밖이어도 이미 저장된 연도(saved)와 같으면 받는다. 통과하면 undefined. */
export function printYearError(year: number, currentYear: number, saved?: number): string | undefined {
  if (isInPrintYearRange(year, currentYear) || (saved !== undefined && year === saved)) return undefined
  const { min, max } = printYearRange(currentYear)
  return `연도는 ${min}~${max}년 중에서 골라 주세요.`
}

/** 사양에 연도가 있는 종류(월간·연간 달력). */
export function kindHasYear(kind: PrintKind): boolean {
  return "year" in DEFAULT_SPECS[kind]
}

export function specYear(spec: PrintSpec): number | undefined {
  return "year" in spec ? spec.year : undefined
}
