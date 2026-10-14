export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export type Month = (typeof MONTHS)[number]

export function isMonth(value: string): boolean {
  return MONTHS.some((month) => String(month) === value)
}
