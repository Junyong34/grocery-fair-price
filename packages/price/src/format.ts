// 가격 · 날짜 표시. 날짜는 서울 기준 "YYYY-MM-DD" 문자열로만 다룬다(시간대 계산 없음).

const WON = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 })

/** 4500 → "4,500". "원"은 화면이 붙인다. */
export function won(price: number): string {
  return WON.format(Math.round(price))
}

const DAY_MS = 86_400_000
const toUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

/** "2026-10-23" → "10/23" */
export function monthDay(iso: string): string {
  const [, month, day] = iso.split("-")
  return `${Number(month)}/${Number(day)}`
}

/** from에서 to까지 날 수. to가 앞이면 음수. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS)
}

/** 날짜에 날 수를 더한다. */
export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10)
}

/** 며칠 전인지 한 마디로("2주 전"). */
export function agoLabel(days: number): string {
  if (days <= 0) return "오늘"
  if (days === 1) return "어제"
  if (days < 7) return `${days}일 전`
  if (days < 30) return `${Math.floor(days / 7)}주 전`
  return `${Math.floor(days / 30)}개월 전`
}

/** 8 → "+8%", -15 → "-15%" */
export function signedPct(pct: number): string {
  return `${pct > 0 ? "+" : ""}${pct}%`
}

/** 연 · 월 · 일 → "YYYY-MM-DD" */
export function isoDate({ year, month, day }: { year: number; month: number; day: number }): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}
