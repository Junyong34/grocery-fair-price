// 평소가 = 수준 × 계절비율 (judgment.md 1-3, 로드맵 ②). 품종·규격 하나의 소매 national 시세(daily_quote)로 계산하는 순수 함수.
//   계절비율(d) = median{ 시세(t) ÷ 연중앙값(t) : t는 기준일 전 3년 중 d와 같은 날 ±7일 }
//   연중앙값(t) = t를 끝으로 하는 365일 시세의 중앙값 (달력 해로 자르면 연말·연초에 계단이 생긴다)
//   수준        = median{ 시세(t) ÷ 계절비율(t) : t는 기준일 전 26주 }
//   평소가(d)   = 수준 × 계절비율(d)
// 판정 전(평소가 없음): 계절비율 이력이 2년보다 짧거나, 최근 26주에 시세가 있는 주가 8주보다 적거나, 그날 계절비율이 없을 때 (3장).
// 숫자(창, 26주, 20%, 바닥·천장)는 judgment.md의 가정이다. 실제 데이터로 판정 분포를 본 뒤 calc_param으로 옮긴다.
import { addDays } from "../ingest/collect.ts"

export type Point = { day: string; price: number } // day: YYYY-MM-DD, 날짜 순, 하루 하나

export const SEASON_DEFAULTS = {
  windowDays: 7, // 계절비율을 모으는 앞뒤 날 수
  seasonYears: 3, // 계절비율을 만드는 기간
  minHistoryDays: 730, // 계절비율 이력이 이보다 짧으면 판정 전 (2년)
  levelDays: 182, // 수준을 내는 기간 (26주)
  minLevelWeeks: 8, // 수준 기간 안에 시세가 있어야 하는 주 수
  bandPercentile: 0.2, // 판정 구간: 시세 ÷ 평소가의 하위·상위 20%
  bandFloor: 0.05, // 구간 바닥 ±5%
  bandCeiling: 0.25, // 구간 천장 ±25%
} as const

export type SeasonParams = { -readonly [K in keyof typeof SEASON_DEFAULTS]: number }

const YEAR = 365

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

// 선형 보간 백분위 (p: 0~1)
function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const at = p * (sorted.length - 1)
  const lo = Math.floor(at)
  return sorted[lo]! + (sorted[Math.min(lo + 1, sorted.length - 1)]! - sorted[lo]!) * (at - lo)
}

const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

// 윤년이 아닌 해의 날 번호 0~364. 2월 29일은 2월 28일과 같다
export function dayOfYear(day: string): number {
  const month = Number(day.slice(5, 7))
  const date = Math.min(Number(day.slice(8, 10)), month === 2 ? 28 : 31)
  return MONTH_START[month - 1]! + date - 1
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

export type Ratio = { day: string; ratio: number }

// 날마다 시세 ÷ 연중앙값. 첫 시세에서 365일이 차기 전의 날은 연중앙값이 한 해를 덮지 못해 내지 않는다
export function seasonRatios(points: readonly Point[]): Ratio[] {
  if (points.length === 0) return []
  const first = points[0]!.day
  const out: Ratio[] = []
  let start = 0
  for (let i = 0; i < points.length; i++) {
    const { day, price } = points[i]!
    while (daysBetween(points[start]!.day, day) >= YEAR) start++
    if (daysBetween(first, day) < YEAR - 1) continue
    const yearMedian = median(points.slice(start, i + 1).map((p) => p.price))!
    out.push({ day, ratio: price / yearMedian })
  }
  return out
}

// 기준일 전 seasonYears년의 비율로 날 번호마다 계절비율을 낸다. ±windowDays 안에 비율이 없는 날 번호는 없다 (제철이 아님)
export function seasonIndex(ratios: readonly Ratio[], asOf: string, params: SeasonParams = SEASON_DEFAULTS): Map<number, number> {
  const from = addDays(asOf, -YEAR * params.seasonYears)
  const buckets: number[][] = Array.from({ length: YEAR }, () => [])
  for (const r of ratios) if (r.day > from && r.day <= asOf) buckets[dayOfYear(r.day)]!.push(r.ratio)
  const index = new Map<number, number>()
  for (let slot = 0; slot < YEAR; slot++) {
    const values: number[] = []
    for (let k = -params.windowDays; k <= params.windowDays; k++) values.push(...buckets[(slot + k + YEAR) % YEAR]!)
    const m = median(values)
    if (m !== null) index.set(slot, m)
  }
  return index
}

// 기준일 전 levelDays의 시세 ÷ 그날 계절비율의 중앙값. 시세가 있는 주가 minLevelWeeks보다 적으면 null
export function levelOf(
  points: readonly Point[],
  index: ReadonlyMap<number, number>,
  asOf: string,
  params: SeasonParams = SEASON_DEFAULTS,
): number | null {
  const from = addDays(asOf, -params.levelDays)
  const values: number[] = []
  const weeks = new Set<number>()
  for (const p of points) {
    if (p.day <= from || p.day > asOf) continue
    const si = index.get(dayOfYear(p.day))
    if (si === undefined) continue
    values.push(p.price / si)
    weeks.add(Math.floor(daysBetween(from, p.day) / 7))
  }
  return weeks.size >= params.minLevelWeeks ? median(values) : null
}

export type UsualPrice = {
  value: number
  components: { level: number; season_index: number; level_weeks: number; season_years: number; window_days: number }
}

// asOf까지의 시세로 target 날의 평소가. 이력이 짧거나 수준·계절비율이 없으면 null (판정 전)
export function usualPrice(
  points: readonly Point[],
  index: ReadonlyMap<number, number>,
  asOf: string,
  target: string,
  params: SeasonParams = SEASON_DEFAULTS,
): UsualPrice | null {
  const firstRatioDay = points.length === 0 ? null : addDays(points[0]!.day, YEAR - 1)
  if (firstRatioDay === null || daysBetween(firstRatioDay, asOf) < params.minHistoryDays) return null
  const si = index.get(dayOfYear(target))
  const level = levelOf(points, index, asOf, params)
  if (si === undefined || level === null) return null
  return {
    value: level * si,
    components: {
      level,
      season_index: si,
      level_weeks: Math.round(params.levelDays / 7),
      season_years: params.seasonYears,
      window_days: params.windowDays,
    },
  }
}

// 판정 구간: 지난 (시세 ÷ 평소가 − 1)의 하위·상위 bandPercentile, 바닥·천장으로 자른다. 소수 둘째 자리(1%p)까지
export function bandOf(deviations: readonly number[], params: SeasonParams = SEASON_DEFAULTS): { low: number; high: number } | null {
  if (deviations.length === 0) return null
  const clamp = (v: number) => Math.min(params.bandCeiling, Math.max(params.bandFloor, v))
  const round = (v: number) => Math.round(v * 100) / 100
  return {
    low: -round(clamp(-percentile(deviations, params.bandPercentile))),
    high: round(clamp(percentile(deviations, 1 - params.bandPercentile))),
  }
}
