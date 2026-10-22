// 대조 기간: KST 기준 오늘부터 과거 N일의 폴더만 Storage에서 목록으로 읽는다 (2026-10-22 결정: 7일).
import type { DbSource } from "./types.ts"

export const RECONCILE_DAYS = 7

const DAY_MS = 86_400_000
const KST_OFFSET_MS = 9 * 3_600_000

// 오늘(YYYY-MM-DD)부터 과거 days일을 최신순으로 준다
export function recentDays(today: string, days = RECONCILE_DAYS): string[] {
  const start = Date.parse(`${today}T00:00:00Z`)
  return Array.from({ length: days }, (_, index) => new Date(start - index * DAY_MS).toISOString().slice(0, 10))
}

// 시각을 KST 날짜로 바꾼다. 폴더 날짜는 KST 수집일이다 (pipeline 3-7).
export function kstDateOf(instant: string): string {
  return new Date(Date.parse(instant) + KST_OFFSET_MS).toISOString().slice(0, 10)
}

// 지금 시각의 KST 오늘
export function seoulToday(now: Date = new Date()): string {
  return kstDateOf(now.toISOString())
}

// 날짜 폴더 접두사: {출처}/{YYYY}/{MM}/{DD}/ (버킷 이름 raw는 객체 키에 넣지 않는다)
export function dayPrefix(source: DbSource, date: string): string {
  return `${source}/${date.slice(0, 4)}/${date.slice(5, 7)}/${date.slice(8, 10)}/`
}

// 저장소에 있으나 기록이 없는 키 (정렬). 이것이 DB 장애 뒤에 빠진 원본이다.
export function missingKeys(stored: readonly string[], registered: ReadonlySet<string>): string[] {
  return stored.filter((key) => !registered.has(key)).sort()
}
