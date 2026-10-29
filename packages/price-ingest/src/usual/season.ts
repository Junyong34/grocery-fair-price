// 평소가 = 수준 × 계절비율 (judgment.md 1-3, 로드맵 ②). 품종·규격 하나의 소매 national 시세(daily_quote)로 계산하는 순수 함수.
//   계절비율(d) = median{ 시세(t) ÷ 연중앙값(t) : t는 기준일 전 3년 중 d와 같은 날 ±7일 }
//   연중앙값(t) = t를 끝으로 하는 365일 시세의 중앙값 (달력 해로 자르면 연말·연초에 계단이 생긴다)
//   수준        = median{ 시세(t) ÷ 계절비율(t) : t는 기준일 전 26주 }
//   평소가(d)   = 수준 × 계절비율(d)
// 판정 전(평소가 없음): 계절비율 이력이 2년보다 짧거나, 최근 26주에 시세가 있는 주가 8주보다 적거나, 그날 계절비율이 없을 때 (3장),
// 제철 품목일 때 (최근 12개월 중 시세가 있는 달이 10달보다 적다. 26주 수준이 지난 철 끝물·이번 철 첫물 몇 주로 정해져 크게 치우친다,
// 5장 백테스트 2026-10-29). KAMIS 소매는 평일만 조사해 1년 내내 나오는 품목도 시세가 있는 날은 약 250일이라 날 수가 아니라 달 수로 본다.
// 숫자(창, 26주, 20%, 바닥·천장)는 judgment.md의 가정이다. 실제 데이터로 판정 분포를 본 뒤 calc_param으로 옮긴다.
import { addDays } from "../ingest/collect.ts"

export type Point = { day: string; price: number; n?: number } // day: YYYY-MM-DD, 날짜 순, 하루 하나. n: 그날 조사 시장 수

export const SEASON_DEFAULTS = {
  windowDays: 7, // 계절비율을 모으는 앞뒤 날 수
  seasonYears: 3, // 계절비율을 만드는 기간
  minHistoryDays: 730, // 계절비율 이력이 이보다 짧으면 판정 전 (2년)
  levelDays: 182, // 수준을 내는 기간 (26주)
  minLevelWeeks: 8, // 수준 기간 안에 시세가 있어야 하는 주 수
  minActiveMonths: 10, // 최근 12개월 중 시세가 있어야 하는 달 수 (이보다 적으면 제철 품목, 판정 전)
  minBandDays: 365, // 품종별 판정 구간을 쓰려면 판정한 날이 이만큼. 그 전에는 카테고리 공통 구간
  minGradeShare: 0.5, // 조사 시장 수가 같은 품종에서 가장 많은 규격의 이 비율보다 적은 규격은 판정하지 않는다 (5-2 중품)
  minSeasonConsistency: 0, // 해마다 계절 모양이 닮은 정도(상관계수 평균)가 이보다 낮으면(해마다 반대 모양) 계절비율을 1로 둔다 (5-4)
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

// asOf가 속한 달까지 달력 12개월 중 시세가 있는 달 수
export function activeMonths(points: readonly Point[], asOf: string): number {
  const [y, m] = [Number(asOf.slice(0, 4)), Number(asOf.slice(5, 7))]
  const first = m === 12 ? `${y}-01` : `${y - 1}-${String(m + 1).padStart(2, "0")}`
  return new Set(points.filter((p) => p.day <= asOf && p.day.slice(0, 7) >= first).map((p) => p.day.slice(0, 7))).size
}

// 판정 전인 이유. 화면은 이유와 상관없이 "판정 전"을 보이지만, 기록·검산에 남긴다
export type NoUsualReason = "short_history" | "seasonal_item" | "thin_level" | "off_season" | "thin_grade"

export function noUsualReason(
  points: readonly Point[],
  index: ReadonlyMap<number, number>,
  asOf: string,
  target: string,
  params: SeasonParams = SEASON_DEFAULTS,
): NoUsualReason | null {
  const firstRatioDay = points.length === 0 ? null : addDays(points[0]!.day, YEAR - 1)
  if (firstRatioDay === null || daysBetween(firstRatioDay, asOf) < params.minHistoryDays) return "short_history"
  if (activeMonths(points, asOf) < params.minActiveMonths) return "seasonal_item"
  if (!index.has(dayOfYear(target))) return "off_season"
  if (levelOf(points, index, asOf, params) === null) return "thin_level"
  return null
}

// asOf까지의 시세로 target 날의 평소가. 판정 전이면 null (이유는 noUsualReason)
export function usualPrice(
  points: readonly Point[],
  index: ReadonlyMap<number, number>,
  asOf: string,
  target: string,
  params: SeasonParams = SEASON_DEFAULTS,
): UsualPrice | null {
  const firstRatioDay = points.length === 0 ? null : addDays(points[0]!.day, YEAR - 1)
  if (firstRatioDay === null || daysBetween(firstRatioDay, asOf) < params.minHistoryDays) return null
  if (activeMonths(points, asOf) < params.minActiveMonths) return null
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

// 판정 구간 고르기: 품종의 판정한 날이 minBandDays 이상이면 품종 구간, 아니면 카테고리 공통 구간
// (판정한 날이 적으면 품종 분포가 한쪽에 몰려 구간이 바닥에 걸린다, 5장). 둘 다 없으면 null
export function chooseBand(
  own: readonly number[],
  category: readonly number[],
  params: SeasonParams = SEASON_DEFAULTS,
): { low: number; high: number; basis: "variety" | "category" } | null {
  if (own.length >= params.minBandDays) {
    const band = bandOf(own, params)
    return band && { ...band, basis: "variety" }
  }
  const band = bandOf(category, params)
  return band && { ...band, basis: "category" }
}

// 규격마다 최근 levelDays의 하루 조사 시장 수 중앙값. 시장 수를 모르는 규격은 빠진다
export function recentMarketCount(points: readonly Point[], asOf: string, params: SeasonParams = SEASON_DEFAULTS): number | null {
  const from = addDays(asOf, -params.levelDays)
  return median(points.filter((p) => p.day > from && p.day <= asOf && p.n !== undefined).map((p) => p.n!))
}

// 표본이 적은 규격 (5-2): 같은 품종에서 조사 시장이 가장 많은 규격의 minGradeShare보다 적다.
// 등급마다 조사하는 시장이 달라, 적은 등급의 national 중앙값은 다른 등급과도 자기 과거와도 비교할 수 없다
// (감자 중품: 같은 시장에선 상품의 0.69배인데 중품을 조사하는 시장이 비싼 곳에 몰려 national 중앙값은 상품보다 비쌌다).
// counts: 규격 키 → recentMarketCount. 돌려주는 값: 판정하지 않을 규격 키
export function thinGrades(counts: ReadonlyMap<string, number | null>, params: SeasonParams = SEASON_DEFAULTS): Set<string> {
  const known = [...counts.values()].filter((n): n is number => n !== null)
  const most = known.length === 0 ? 0 : Math.max(...known)
  return new Set([...counts].filter(([, n]) => n !== null && n < most * params.minGradeShare).map(([key]) => key))
}

function pearson(xs: readonly number[], ys: readonly number[]): number | null {
  const n = xs.length
  if (n < 3) return null
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (xs[i]! - mx) * (ys[i]! - my)
    sxx += (xs[i]! - mx) ** 2
    syy += (ys[i]! - my) ** 2
  }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy)
}

// 계절이 해마다 반복되나 (5-4). 기준일 전 seasonYears년을 1년씩 나눠 해마다 달별 비율 중앙값(계절 모양)을 만든다.
// 해마다 그 모양이 나머지 해 모양의 평균과 얼마나 닮았는지(달별 상관계수)를 보고 평균한다. 1이면 해마다 같은 모양, 0 근처면 우연.
// 6달 넘게 겹치는 해가 둘보다 적으면 null (판단하지 않는다)
export function seasonConsistency(ratios: readonly Ratio[], asOf: string, params: SeasonParams = SEASON_DEFAULTS): number | null {
  const years: Map<number, number[]>[] = Array.from({ length: params.seasonYears }, () => new Map())
  for (const r of ratios) {
    const age = daysBetween(r.day, asOf)
    if (age < 0) continue
    const k = Math.floor(age / YEAR)
    if (k >= params.seasonYears) continue
    const month = Number(r.day.slice(5, 7))
    const list = years[k]!.get(month) ?? []
    list.push(r.ratio)
    years[k]!.set(month, list)
  }
  const profiles = years.map((y) => new Map([...y].map(([m, v]) => [m, median(v)!]))).filter((p) => p.size >= 6)
  if (profiles.length < 2) return null
  const scores: number[] = []
  for (let i = 0; i < profiles.length; i++) {
    const others = profiles.filter((_, j) => j !== i)
    const xs: number[] = []
    const ys: number[] = []
    for (const [m, v] of profiles[i]!) {
      const rest = others.map((o) => o.get(m)).filter((x): x is number => x !== undefined)
      if (rest.length === 0) continue
      xs.push(v)
      ys.push(rest.reduce((a, b) => a + b, 0) / rest.length)
    }
    if (xs.length < 6) continue
    const r = pearson(xs, ys)
    if (r !== null) scores.push(r)
  }
  return scores.length === 0 ? null : scores.reduce((a, b) => a + b, 0) / scores.length
}

// 평소가에 쓸 계절비율: 해마다 모양이 닮지 않으면(일관성 < minSeasonConsistency) 모든 날 1. 판단할 수 없으면 그대로
export function usedSeasonIndex(
  ratios: readonly Ratio[],
  asOf: string,
  params: SeasonParams = SEASON_DEFAULTS,
): { index: Map<number, number>; flat: boolean; consistency: number | null } {
  const consistency = seasonConsistency(ratios, asOf, params)
  if (consistency !== null && consistency < params.minSeasonConsistency) {
    return { index: new Map(Array.from({ length: YEAR }, (_, slot) => [slot, 1])), flat: true, consistency }
  }
  return { index: seasonIndex(ratios, asOf, params), flat: false, consistency }
}

