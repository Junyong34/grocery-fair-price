// 판정 숫자(창 크기, 수준 기간, 백분위, 바닥·천장)를 바꿔 가며 실제 시세로 돌려 본다 (judgment.md 6장). DB를 바꾸지 않는다.
//   node --env-file=../../.env scripts/judgment-sweep.ts [--from 2025-10-29] [--to 2026-10-28] [--only usual|band|smooth|sample]
// season-backtest.ts와 달리 판정 구간도 운영처럼 그날 전까지의 편차로만 낸다 (표본 밖 검사).
// 평소가 오차(|시세 ÷ 평소가 − 1|)는 창·수준 기간만 정하고, 판정 비율은 구간 숫자가 정한다.
// 환경변수: INGEST_DATABASE_URL
import { parseArgs } from "node:util"

import { addDays } from "../src/ingest/collect.ts"
import { connectIngest } from "../src/load/db.ts"
import { seasonAsOf } from "../src/usual/compute.ts"
import {
  bandOf,
  median,
  recentMarketCount,
  SEASON_DEFAULTS,
  seasonRatios,
  thinGrades,
  usedSeasonIndex,
  usualPrice,
  type Point,
  type SeasonParams,
} from "../src/usual/season.ts"

const { values } = parseArgs({ options: { from: { type: "string" }, to: { type: "string" }, only: { type: "string" } }, strict: true })
const runs = (section: string) => values.only === undefined || values.only === section
const to = values.to ?? "2026-10-28"
const from = values.from ?? addDays(to, -364)

const sql = connectIngest(process.env.INGEST_DATABASE_URL!)
const rows = await sql<{ variety_id: number; spec_id: number; category: string; day: string; price: string; n: number }[]>`
  select q.variety_id, q.spec_id, c.slug as category, q.obs_date::text as day, q.value::text as price, q.n
    from price.daily_quote q
    join price.variety v on v.id = q.variety_id
    join price.item i on i.id = v.item_id
    join price.category c on c.id = i.category_id
   where q.basis = 'quote' and q.price_tier = 'retail' and q.scope_key = 'national' and q.obs_date <= ${to}
   order by q.spec_id, q.obs_date`
await sql.end()

type Series = { varietyId: number; specId: number; category: string; points: Point[] }
const bySpec = new Map<number, Series>()
for (const r of rows) {
  const s = bySpec.get(r.spec_id) ?? { varietyId: r.variety_id, specId: r.spec_id, category: r.category, points: [] }
  s.points.push({ day: r.day, price: Number(r.price), n: r.n })
  bySpec.set(r.spec_id, s)
}
const series = [...bySpec.values()]

// 표본이 적은 규격은 운영처럼 뺀다 (to 기준)
function thinSet(params: SeasonParams): Set<number> {
  const byVariety = new Map<number, Map<string, number | null>>()
  for (const s of series) {
    const m = byVariety.get(s.varietyId) ?? new Map<string, number | null>()
    m.set(String(s.specId), recentMarketCount(s.points, to, params))
    byVariety.set(s.varietyId, m)
  }
  return new Set([...byVariety.values()].flatMap((m) => [...thinGrades(m, params)]).map(Number))
}

type Dev = { day: string; d: number; n: number }

// 창·수준 기간 하나로 규격마다 날마다의 편차를 낸다. 구간 숫자와 무관하다
function deviations(params: SeasonParams): { s: Series; devs: Dev[]; priceDays: number }[] {
  const thin = thinSet(params)
  const out: { s: Series; devs: Dev[]; priceDays: number }[] = []
  const historyFrom = addDays(from, -365) // 구간 재료는 기간 앞 1년부터 모은다 (운영의 3년 중 실제로 판정이 나는 쪽)
  for (const s of series) {
    const ratios = seasonRatios(s.points)
    const cache = new Map<string, ReturnType<typeof usedSeasonIndex>>()
    const devs: Dev[] = []
    let priceDays = 0
    let pastEnd = 0
    for (const p of s.points) {
      if (p.day < historyFrom) continue
      if (p.day >= from) priceDays++
      if (thin.has(s.specId)) continue
      while (pastEnd < s.points.length && s.points[pastEnd]!.day < p.day) pastEnd++
      const key = seasonAsOf(p.day)
      let used = cache.get(key)
      if (!used) cache.set(key, (used = usedSeasonIndex(ratios, key, params)))
      const usual = usualPrice(s.points.slice(0, pastEnd), used.index, addDays(p.day, -1), p.day, params)
      if (usual) devs.push({ day: p.day, d: p.price / usual.value - 1, n: p.n ?? 0 })
    }
    out.push({ s, devs, priceDays })
  }
  return out
}

type Verdict = "cheap" | "normal" | "expensive"

// 날마다 그날 전까지의 편차로 구간을 내 판정한다 (품종 판정한 날이 minBandDays 이상이면 품종 구간, 아니면 카테고리 공통)
// smooth: 그날을 끝으로 하는 시세 있는 날 smooth개의 편차 중앙값으로 판정한다 (1이면 그날 편차 그대로)
function judge(passes: ReturnType<typeof deviations>, params: SeasonParams, smooth = 1) {
  // 카테고리 공통 구간을 날마다 다시 내면 느리다. 달마다 그 달 1일 전까지로 낸다
  const pooledByCat = new Map<string, Dev[]>()
  for (const { s, devs } of passes) pooledByCat.set(s.category, [...(pooledByCat.get(s.category) ?? []), ...devs])
  for (const list of pooledByCat.values()) list.sort((a, b) => (a.day < b.day ? -1 : 1))
  const catBand = new Map<string, { low: number; high: number } | null>()
  const bandFor = (cat: string, month: string) => {
    const key = `${cat}|${month}`
    if (!catBand.has(key)) {
      const before = pooledByCat.get(cat)!.filter((x) => x.day < `${month}-01`).map((x) => x.d)
      catBand.set(key, before.length >= 60 ? bandOf(before, params) : null)
    }
    return catBand.get(key)!
  }
  const counts = { cheap: 0, normal: 0, expensive: 0 }
  const flips: number[] = []
  const perSpecShare: { cheap: number; expensive: number }[] = []
  for (const { s, devs } of passes) {
    let last: Verdict | null = null
    let changed = 0
    const own = { cheap: 0, normal: 0, expensive: 0 }
    devs.forEach((x, i) => {
      if (x.day < from) return
      const band = i >= params.minBandDays ? bandOf(devs.slice(0, i).map((y) => y.d), params) : bandFor(s.category, x.day.slice(0, 7))
      if (!band) return
      const d = smooth === 1 ? x.d : median(devs.slice(Math.max(0, i - smooth + 1), i + 1).map((y) => y.d))!
      const v: Verdict = d < band.low ? "cheap" : d > band.high ? "expensive" : "normal"
      counts[v]++
      own[v]++
      if (last && last !== v) changed++
      last = v
    })
    const total = own.cheap + own.normal + own.expensive
    if (total > 0) {
      flips.push((changed * 365) / total)
      perSpecShare.push({ cheap: own.cheap / total, expensive: own.expensive / total })
    }
  }
  const total = counts.cheap + counts.normal + counts.expensive
  return {
    share: { cheap: counts.cheap / total, normal: counts.normal / total, expensive: counts.expensive / total },
    flips: median(flips) ?? 0,
    // 판정이 한쪽으로 몰린 규격: 싸요나 비싸요가 40%를 넘는다
    skewed: perSpecShare.filter((x) => x.cheap > 0.4 || x.expensive > 0.4).length,
    specs: perSpecShare.length,
  }
}

const r1 = (v: number) => (Math.round(v * 1000) / 10).toFixed(1)

console.log(`기간 ${from} ~ ${to}, 규격 ${series.length}개\n`)
console.log("## 평소가 (창 · 수준 기간): 판정한 날의 |편차| 중앙값(규격별 중앙), 편향, 평소가가 나온 비율")
const base = { ...SEASON_DEFAULTS } as SeasonParams
const usualRuns = new Map<string, ReturnType<typeof deviations>>()
for (const windowDays of runs("usual") ? [3, 7, 14, 21] : [7, 14]) {
  for (const levelDays of runs("usual") ? [91, 182, 364] : [182]) {
    const params = { ...base, windowDays, levelDays, minLevelWeeks: Math.round((8 * levelDays) / 182) }
    const started = Date.now()
    const passes = deviations(params)
    usualRuns.set(`${windowDays}|${levelDays}`, passes)
    const inRange = passes.map((p) => ({ ...p, devs: p.devs.filter((x) => x.day >= from) })).filter((p) => p.devs.length > 0)
    const err = median(inRange.map((p) => median(p.devs.map((x) => Math.abs(x.d)))!))!
    const bias = median(inRange.map((p) => median(p.devs.map((x) => x.d))!))!
    const biased = inRange.filter((p) => Math.abs(median(p.devs.map((x) => x.d))!) > 0.05).length
    const coverage = inRange.reduce((a, p) => a + p.devs.length, 0) / passes.reduce((a, p) => a + p.priceDays, 0)
    console.log(
      `창 ±${windowDays}일, 수준 ${levelDays}일: 오차 ${r1(err)}%, 편향 ${r1(bias)}% (|편향|>5% ${biased}개), 규격 ${inRange.length}개, 평소가 ${r1(coverage)}% (${Math.round((Date.now() - started) / 1000)}초)`,
    )
  }
}

console.log("\n## 창 · 수준 기간마다 기본 구간(20%, ±5~25%)으로 판정: 비율, 바뀐 횟수, 몰린 규격")
for (const [key, run] of usualRuns) {
  const j = judge(run, base)
  const [w, l] = key.split("|")
  console.log(`창 ±${w}일, 수준 ${l}일: 싸요 ${r1(j.share.cheap)} · 보통 ${r1(j.share.normal)} · 비싸요 ${r1(j.share.expensive)}%, 바뀜 ${j.flips.toFixed(0)}번, 몰린 규격 ${j.skewed}/${j.specs}`)
}

if (runs("band")) {
console.log("\n## 판정 구간 (창 ±7일, 수준 182일 고정): 표본 밖 판정 비율, 판정이 바뀐 횟수(1년, 규격별 중앙), 한쪽으로 몰린 규격")
const passes = usualRuns.get("7|182")!
for (const bandPercentile of [0.15, 0.2, 0.25]) {
  for (const bandFloor of [0.03, 0.05, 0.07]) {
    for (const bandCeiling of [0.2, 0.25, 0.3]) {
      const j = judge(passes, { ...base, bandPercentile, bandFloor, bandCeiling })
      console.log(
        `백분위 ${bandPercentile}, 바닥 ${bandFloor}, 천장 ${bandCeiling}: 싸요 ${r1(j.share.cheap)} · 보통 ${r1(j.share.normal)} · 비싸요 ${r1(j.share.expensive)}%, 바뀜 ${j.flips.toFixed(0)}번, 몰린 규격 ${j.skewed}/${j.specs}`,
      )
    }
  }
}
}

if (runs("smooth")) {
  console.log("\n## 판정을 최근 며칠 편차의 중앙값으로 (창 ±14일, 수준 182일, 기본 구간)")
  for (const smooth of [1, 3, 5]) {
    const j = judge(usualRuns.get("14|182")!, base, smooth)
    console.log(`최근 ${smooth}일: 싸요 ${r1(j.share.cheap)} · 보통 ${r1(j.share.normal)} · 비싸요 ${r1(j.share.expensive)}%, 바뀜 ${j.flips.toFixed(0)}번, 몰린 규격 ${j.skewed}/${j.specs}`)
  }
}

if (runs("sample")) {
  // 조사 시장 수(n)가 적은 날의 편차가 더 큰가 (aggregate.min_n). KAMIS 시세 표본만 n이 시장 수다 (축평원 전국 값은 1)
  console.log("\n## 조사 시장 수별 |편차| (창 ±14일, 수준 182일, 판정한 날)")
  const all = usualRuns.get("14|182")!.flatMap((p) => p.devs.filter((x) => x.day >= from))
  for (const [lo, hi] of [[1, 2], [3, 4], [5, 9], [10, 19], [20, 39], [40, 999]] as const) {
    const xs = all.filter((x) => x.n >= lo && x.n <= hi).map((x) => Math.abs(x.d))
    if (xs.length > 0) console.log(`  ${lo}~${hi}곳: ${xs.length}일, |편차| 중앙 ${r1(median(xs)!)}%, 상위 10% ${r1(xs.sort((a, b) => a - b)[Math.floor(xs.length * 0.9)]!)}%`)
  }
  // 하루 조사 시장 수가 그 규격 최근 중앙값의 절반보다 적은 날 (평소보다 표본이 크게 준 날)
  const dropped: number[] = []
  const usual: number[] = []
  for (const p of usualRuns.get("14|182")!) {
    const typical = median(p.s.points.slice(-120).map((x) => x.n ?? 0)) ?? 0
    for (const x of p.devs) if (x.day >= from) (x.n < typical / 2 ? dropped : usual).push(Math.abs(x.d))
  }
  console.log(`  평소의 절반보다 적은 날: ${dropped.length}일, |편차| 중앙 ${r1(median(dropped) ?? 0)}% / 나머지 ${r1(median(usual)!)}%`)

  // 같은 national 값이 이어진 길이 (stale_days, carried_over_days)
  console.log("\n## 같은 national 값이 이어진 시세 있는 날 수 (규격 · 출처별, 기간 안)")
  const runsOf = (pts: Point[]) => {
    const out: number[] = []
    let len = 1
    for (let i = 1; i < pts.length; i++) {
      if (pts[i]!.price === pts[i - 1]!.price) len++
      else {
        out.push(len)
        len = 1
      }
    }
    if (pts.length) out.push(len)
    return out
  }
  for (const [label, test] of [
    ["n = 1 (축평원 전국 값 등)", (n: number) => n === 1],
    ["n ≥ 2 (KAMIS 시장 표본)", (n: number) => n >= 2],
  ] as const) {
    const lens = series.flatMap((s) => {
      const pts = s.points.filter((p) => p.day >= from)
      return pts.length && test(median(pts.map((p) => p.n ?? 0)) ?? 0) ? runsOf(pts) : []
    })
    const hist = [1, 2, 3, 5, 7, 14].map((k, i, ks) => {
      const hi = ks[i + 1] ?? Infinity
      return `${k}${hi === Infinity ? "+" : hi - 1 > k ? `~${hi - 1}` : ""}일 ${lens.filter((l) => l >= k && l < hi).length}`
    })
    console.log(`  ${label}: ${hist.join(", ")}, 최대 ${Math.max(0, ...lens)}`)
  }
}
