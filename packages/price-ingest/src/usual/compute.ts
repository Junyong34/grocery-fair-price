// 품종·규격 여럿의 계절비율과 평소가를 한 번에 낸다 (judgment.md 1·2장). DB를 모르는 순수 함수다. DB 읽기·쓰기는 cli.ts.
//   계절비율: 기준일이 속한 달의 1일 전날을 기준으로 만든다 (달마다 다시 만든다. 백테스트와 같다)
//   평소가: target 날마다 그 전날까지의 시세로 낸다 (그날 시세가 평소가에 섞이지 않게)
//   판정 구간: 가장 최근 날에만 낸다. 지난 시세 ÷ 평소가 − 1로, 판정한 날이 1년보다 적으면 카테고리 공통 구간
//   표본이 적은 규격(같은 품종에서 조사 시장이 가장 많은 규격의 절반 미만, 5-2)은 평소가를 내지 않는다. 계절비율 표는 만든다
import { addDays } from "../ingest/collect.ts"
import {
  chooseBand,
  dayOfYear,
  recentMarketCount,
  SEASON_DEFAULTS,
  seasonIndex,
  seasonRatios,
  thinGrades,
  usualPrice,
  type Point,
  type SeasonParams,
  type UsualPrice,
} from "./season.ts"

export const SEASON_METHOD = "median-ratio-3y-7d-1"
export const USUAL_METHOD = "level-x-season-1"

export type SpecSeries = { varietyId: number; specId: number; category: string; points: readonly Point[] }

export type SeasonRow = { varietyId: number; specId: number; slot: number; value: number; n: number; asOf: string }

export type UsualRow = {
  varietyId: number
  specId: number
  asOf: string
  value: number
  components: UsualPrice["components"] & { band?: { low: number; high: number; basis: "variety" | "category" } }
}

// 계절비율의 기준일: 그 달 1일의 전날
export function seasonAsOf(day: string): string {
  return addDays(`${day.slice(0, 7)}-01`, -1)
}

// 비율을 다시 세는 일 없이 기준일마다 계절비율을 만든다
function indexFor(ratios: ReturnType<typeof seasonRatios>, cache: Map<string, Map<number, number>>, asOf: string, params: SeasonParams) {
  let index = cache.get(asOf)
  if (!index) {
    index = seasonIndex(ratios, asOf, params)
    cache.set(asOf, index)
  }
  return index
}

// 한 해의 날별 비율 수 (계절비율 표의 n)
function slotCounts(ratios: ReturnType<typeof seasonRatios>, asOf: string, params: SeasonParams): Map<number, number> {
  const from = addDays(asOf, -365 * params.seasonYears)
  const perDay = new Array<number>(365).fill(0)
  for (const r of ratios) if (r.day > from && r.day <= asOf) perDay[dayOfYear(r.day)]! += 1
  const out = new Map<number, number>()
  for (let slot = 0; slot < 365; slot++) {
    let n = 0
    for (let k = -params.windowDays; k <= params.windowDays; k++) n += perDay[(slot + k + 365) % 365]!
    if (n > 0) out.set(slot, n)
  }
  return out
}

// from~to의 날마다 평소가를 내고(시세가 있는 날만), 가장 최근 날에 판정 구간을 붙인다. 그리고 to 기준 계절비율 표.
// 판정 구간의 재료(지난 편차)는 to − 3년부터 모은다
export function computeUsual(
  series: readonly SpecSeries[],
  input: { from: string; to: string },
  params: SeasonParams = SEASON_DEFAULTS,
): { usual: UsualRow[]; season: SeasonRow[] } {
  const historyFrom = addDays(input.to, -365 * params.seasonYears)
  const perSpec: { s: SpecSeries; rows: UsualRow[]; deviations: number[] }[] = []
  const season: SeasonRow[] = []
  const key = (s: SpecSeries) => `${s.varietyId}|${s.specId}`
  const byVariety = new Map<number, Map<string, number | null>>()
  for (const s of series) {
    const counts = byVariety.get(s.varietyId) ?? new Map<string, number | null>()
    counts.set(key(s), recentMarketCount(s.points, input.to, params))
    byVariety.set(s.varietyId, counts)
  }
  const thin = new Set([...byVariety.values()].flatMap((counts) => [...thinGrades(counts, params)]))

  for (const s of series) {
    const ratios = seasonRatios(s.points)
    const cache = new Map<string, Map<number, number>>()
    const byDay = new Map(s.points.map((p) => [p.day, p.price]))
    const rows: UsualRow[] = []
    const deviations: number[] = []
    // 판정 구간 재료는 from보다 앞에서도 모은다
    const start = historyFrom < input.from ? historyFrom : input.from
    let pastEnd = 0
    for (let day = start; day <= input.to && !thin.has(key(s)); day = addDays(day, 1)) {
      const price = byDay.get(day)
      if (price === undefined) continue
      while (pastEnd < s.points.length && s.points[pastEnd]!.day < day) pastEnd++
      const past = s.points.slice(0, pastEnd)
      const asOf = addDays(day, -1)
      const usual = usualPrice(past, indexFor(ratios, cache, seasonAsOf(day), params), asOf, day, params)
      if (!usual) continue
      if (day < input.to) deviations.push(price / usual.value - 1)
      if (day >= input.from) rows.push({ varietyId: s.varietyId, specId: s.specId, asOf: day, value: usual.value, components: usual.components })
    }
    perSpec.push({ s, rows, deviations })

    const asOf = seasonAsOf(input.to)
    const index = indexFor(ratios, cache, asOf, params)
    const counts = slotCounts(ratios, asOf, params)
    for (const [slot, value] of index) season.push({ varietyId: s.varietyId, specId: s.specId, slot, value, n: counts.get(slot)!, asOf })
  }

  const pooled = new Map<string, number[]>()
  for (const { s, deviations } of perSpec) pooled.set(s.category, [...(pooled.get(s.category) ?? []), ...deviations])
  for (const { s, rows, deviations } of perSpec) {
    const last = rows.at(-1)
    if (!last) continue
    const band = chooseBand(deviations, pooled.get(s.category) ?? [], params)
    if (band) last.components = { ...last.components, band }
  }
  return { usual: perSpec.flatMap((x) => x.rows), season }
}
