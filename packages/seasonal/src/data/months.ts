export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export type Month = (typeof MONTHS)[number]

export function isMonth(value: string): boolean {
  return MONTHS.some((month) => String(month) === value)
}

/**
 * 제철 달을 화면 문자열로 만든다. 예: [9, 10] → "제철 9·10월"
 * 달을 원으로 보고 빈 달이 가장 긴 곳 다음부터 적으므로, 해를 넘는 제철은 [1, 2, 11, 12] → "제철 11·12·1·2월"이 된다.
 */
export function formatSeasonMonths(months: readonly number[]): string {
  const sorted = [...new Set(months)].sort((a, b) => a - b)
  let start = 0
  let widestGap = -1
  sorted.forEach((month, i) => {
    const previous = sorted[(i - 1 + sorted.length) % sorted.length]!
    const gap = (month - previous + 12) % 12
    if (gap > widestGap) {
      widestGap = gap
      start = i
    }
  })
  const ordered = [...sorted.slice(start), ...sorted.slice(0, start)]
  return `제철 ${ordered.join("·")}월`
}
