export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export type Month = (typeof MONTHS)[number]

export function isMonth(value: string): boolean {
  return MONTHS.some((month) => String(month) === value)
}

/** 달 이름 표기. 숫자만("1"), 한글("1월"), 영어 약자("Jan"). */
export const MONTH_LABEL_STYLES = ["number", "korean", "english"] as const
export type MonthLabelStyle = (typeof MONTH_LABEL_STYLES)[number]

const ENGLISH_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

/**
 * 달 하나를 고른 표기로 적는다. 예: (1, "korean") → "1월"
 * 영어는 짧게(short, 달 이동 목록)는 "Jan", 길게(long, 달 제목)는 "January"다. 숫자·한글은 길이와 상관없다.
 */
export function formatMonthLabel(month: number, style: MonthLabelStyle, length: "short" | "long" = "short"): string {
  if (style === "korean") return `${month}월`
  if (style === "english") {
    const name = ENGLISH_MONTHS[month - 1]!
    return length === "long" ? name : name.slice(0, 3)
  }
  return String(month)
}

/**
 * 제철 달을 화면 문자열로 만든다. 예: [9, 10] → "제철 9·10월"
 * 달을 원으로 보고 빈 달이 가장 긴 곳 다음부터 적으므로, 해를 넘는 제철은 [1, 2, 11, 12] → "제철 11·12·1·2월"이 된다.
 */
export function formatSeasonMonths(months: readonly number[]): string {
  return `제철 ${orderSeasonMonths(months).join("·")}월`
}

/** 제철 달을 제철이 시작하는 달부터 차례로 늘어놓는다. 예: [1, 2, 11, 12] → [11, 12, 1, 2] */
export function orderSeasonMonths(months: readonly number[]): number[] {
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
  return [...sorted.slice(start), ...sorted.slice(0, start)]
}
