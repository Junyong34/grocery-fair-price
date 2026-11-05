// 2a를 미리 그려 두는 (연, 월) 키(.scratch/seasonal-static/spec.md). 모든 화면이 쓰는 shared/routes.ts가 import하므로
// 데이터(공휴일 등)를 import하지 않는다. 미리 그리는 해의 목록은 static-years.ts에 있다.

/** "2026-03" 모양. 내부 경로 /seasonal/at/[yearMonth]의 세그먼트다. */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

/** formatYearMonth의 역. 형식이 틀리거나 없는 달이면 null. */
export function parseYearMonth(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value)
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null
}

/** 해를 years(오름차순) 범위 안으로 붙인다. */
export function clampYear(year: number, years: readonly number[]): number {
  return Math.min(Math.max(year, years[0]!), years.at(-1)!)
}
