// 품종·규격 여럿의 계절비율과 평소가를 한 번에 낸다 (judgment.md 1·2장). DB를 모르는 순수 함수다. DB 읽기·쓰기는 cli.ts.
//   계절비율: 기준일이 속한 달의 1일 전날을 기준으로 만든다 (달마다 다시 만든다. 백테스트와 같다).
//   해마다 계절 모양이 닮지 않은 규격(쌀 등)은 계절비율을 1로 쓰고 표에도 1을 둔다 (usedSeasonIndex, 5-4)
//   평소가: target 날마다 그 전날까지의 시세로 낸다 (그날 시세가 평소가에 섞이지 않게)
//   판정 구간: 가장 최근 날에만 낸다. 지난 시세 ÷ 평소가 − 1로, 판정한 날이 1년보다 적으면 카테고리 공통 구간
//   판정 차이: 가장 최근 날에만 낸다. 최근 verdictDays개 편차의 중앙값 (verdictDeviation). 판정은 이 값을 구간에 견준다
//   표본이 적은 규격(같은 품종에서 조사 시장이 가장 많은 규격의 절반 미만, 5-2)은 평소가를 내지 않는다. 계절비율 표는 만든다
import { addDays } from "../ingest/collect.ts"
import {
  chooseBand,
  dayOfYear,
  recentMarketCount,
  SEASON_DEFAULTS,
  seasonRatios,
  thinGrades,
  usedSeasonIndex,
  usualPrice,
  verdictDeviation,
  type Point,
  type SeasonParams,
  type UsualPrice,
} from "./season.ts"

export const SEASON_METHOD = "median-ratio-3y-14d-1"
export const USUAL_METHOD = "level-x-season-1"

export type SpecSeries = { varietyId: number; specId: number; category: string; points: readonly Point[] }

// n: 그 칸의 값을 낸 비율 수. 계절비율을 1로 둔 규격은 3년 비율 전체 수
export type SeasonRow = { varietyId: number; specId: number; slot: number; value: number; n: number; asOf: string }

export type UsualRow = {
  varietyId: number
  specId: number
  asOf: string
  value: number
  components: UsualPrice["components"] & {
    season_flat: boolean // 계절이 해마다 반복되지 않아 계절비율을 1로 썼다
    season_consistency: number | null // 해마다 계절 모양이 닮은 정도 (상관계수 평균). 판단할 수 없으면 null
    band?: { low: number; high: number; basis: "variety" | "category" }
    deviation?: number // 판정 차이 (최근 verdictDays개 시세 ÷ 평소가 − 1의 중앙값). 가장 최근 행에만
  }
}

// 계절비율의 기준일: 그 달 1일의 전날
export function seasonAsOf(day: string): string {
  return addDays(`${day.slice(0, 7)}-01`, -1)
}

type UsedIndex = ReturnType<typeof usedSeasonIndex>

// 비율을 다시 세는 일 없이 기준일마다 계절비율을 만든다
function indexFor(ratios: ReturnType<typeof seasonRatios>, cache: Map<string, UsedIndex>, asOf: string, params: SeasonParams): UsedIndex {
  let used = cache.get(asOf)
  if (!used) {
    used = usedSeasonIndex(ratios, asOf, params)
    cache.set(asOf, used)
  }
  return used
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
  const perSpec: { s: SpecSeries; rows: UsualRow[]; deviations: number[]; recent: number[] }[] = []
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
    const cache = new Map<string, UsedIndex>()
    const byDay = new Map(s.points.map((p) => [p.day, p.price]))
    const rows: UsualRow[] = []
    const deviations: number[] = []
    const recent: number[] = [] // to까지의 편차 (판정 차이 재료)
    // 판정 구간 재료는 from보다 앞에서도 모은다
    const start = historyFrom < input.from ? historyFrom : input.from
    let pastEnd = 0
    for (let day = start; day <= input.to && !thin.has(key(s)); day = addDays(day, 1)) {
      const price = byDay.get(day)
      if (price === undefined) continue
      while (pastEnd < s.points.length && s.points[pastEnd]!.day < day) pastEnd++
      const past = s.points.slice(0, pastEnd)
      const asOf = addDays(day, -1)
      const used = indexFor(ratios, cache, seasonAsOf(day), params)
      const usual = usualPrice(past, used.index, asOf, day, params)
      if (!usual) continue
      if (day < input.to) deviations.push(price / usual.value - 1)
      recent.push(price / usual.value - 1)
      if (day >= input.from) rows.push({
          varietyId: s.varietyId,
          specId: s.specId,
          asOf: day,
          value: usual.value,
          components: { ...usual.components, season_flat: used.flat, season_consistency: used.consistency },
        })
    }
    perSpec.push({ s, rows, deviations, recent })

    const asOf = seasonAsOf(input.to)
    const { index, flat } = indexFor(ratios, cache, asOf, params)
    const counts = slotCounts(ratios, asOf, params)
    // 1로 둔 계절비율은 3년 비율 전체가 근거다 (시세가 없던 날의 칸에도 1이 있다)
    const total = ratios.filter((r) => r.day > addDays(asOf, -365 * params.seasonYears) && r.day <= asOf).length
    for (const [slot, value] of index) {
      season.push({ varietyId: s.varietyId, specId: s.specId, slot, value, n: flat ? total : counts.get(slot)!, asOf })
    }
  }

  const pooled = new Map<string, number[]>()
  for (const { s, deviations } of perSpec) pooled.set(s.category, [...(pooled.get(s.category) ?? []), ...deviations])
  for (const { s, rows, deviations, recent } of perSpec) {
    const last = rows.at(-1)
    if (!last) continue
    const band = chooseBand(deviations, pooled.get(s.category) ?? [], params)
    if (band) last.components = { ...last.components, band }
    last.components = { ...last.components, deviation: verdictDeviation(recent, params)! }
  }
  return { usual: perSpec.flatMap((x) => x.rows), season }
}
