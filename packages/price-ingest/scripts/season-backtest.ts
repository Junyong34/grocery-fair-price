// 평소가 식을 실제 시세로 돌려 본다 (judgment.md 5장 "판정 분포 확인"). DB를 바꾸지 않는다.
//   node --env-file=../../.env scripts/season-backtest.ts [--from 2025-10-29] [--to 2026-10-28] [--json 파일]
// 품종·규격마다 소매 national 시세(daily_quote)를 읽고, 기간의 날마다 그날까지의 시세만으로 평소가를 낸다
// (계절비율은 달마다 1일 기준으로 다시 만든다. 운영도 해마다·분기마다 다시 만든다). 그날 시세 ÷ 평소가 − 1을 모은다.
// 환경변수: INGEST_DATABASE_URL
import { writeFileSync } from "node:fs"
import { parseArgs } from "node:util"

import { addDays } from "../src/ingest/collect.ts"
import { connectIngest } from "../src/load/db.ts"
import { chooseBand, median, SEASON_DEFAULTS, seasonIndex, seasonRatios, usualPrice, type Point } from "../src/usual/season.ts"

const { values } = parseArgs({ options: { from: { type: "string" }, to: { type: "string" }, json: { type: "string" } }, strict: true })
const to = values.to ?? "2026-10-28"
const from = values.from ?? addDays(to, -364)

const sql = connectIngest(process.env.INGEST_DATABASE_URL!)
const rows = await sql<{ variety: string; spec_id: number; spec: string; category: string; day: string; price: string }[]>`
  select v.slug as variety, s.id as spec_id, s.name as spec, c.slug as category, q.obs_date::text as day, q.value::text as price
    from price.daily_quote q
    join price.variety v on v.id = q.variety_id
    join price.item i on i.id = v.item_id
    join price.category c on c.id = i.category_id
    join price.spec s on s.id = q.spec_id
   where q.basis = 'quote' and q.price_tier = 'retail' and q.scope_key = 'national' and q.obs_date <= ${to}
   order by q.spec_id, q.obs_date`
await sql.end()

const bySpec = new Map<number, { variety: string; spec: string; category: string; points: Point[] }>()
for (const r of rows) {
  const entry = bySpec.get(r.spec_id) ?? { variety: r.variety, spec: r.spec, category: r.category, points: [] }
  entry.points.push({ day: r.day, price: Number(r.price) })
  bySpec.set(r.spec_id, entry)
}

type SpecResult = {
  variety: string
  spec: string
  category: string
  priceDays: number // 기간 안에 시세가 있는 날
  judged: number // 그중 평소가가 나온 날
  band: { low: number; high: number; basis: "variety" | "category" } | null
  share: { cheap: number; normal: number; expensive: number } | null // 고른 구간으로 낸 판정 비율
  p20: number | null
  p50: number | null // 편향: 0에서 멀면 평소가가 한쪽으로 치우쳤다
  p80: number | null
  share10: { cheap: number; normal: number; expensive: number } | null // ±10% 고정 구간이면
  flips: number // 판정(밴드 기준)이 전날과 바뀐 횟수
}

const pct = (v: number[], p: number) => {
  const s = [...v].sort((a, b) => a - b)
  return s[Math.round(p * (s.length - 1))]!
}

const started = Date.now()
type Pass = { spec: { variety: string; spec: string; category: string }; priceDays: number; deviations: { day: string; d: number }[] }
const passes: Pass[] = []
for (const [, spec] of bySpec) {
  const ratios = seasonRatios(spec.points)
  const byDay = new Map(spec.points.map((p) => [p.day, p.price]))
  const deviations: { day: string; d: number }[] = []
  let indexMonth = ""
  let index = new Map<number, number>()
  let priceDays = 0
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const price = byDay.get(day)
    if (price === undefined) continue
    priceDays++
    // 그날 전까지의 시세만 쓴다 (그날 시세가 평소가에 섞이지 않게)
    const asOf = addDays(day, -1)
    if (day.slice(0, 7) !== indexMonth) {
      indexMonth = day.slice(0, 7)
      index = seasonIndex(ratios, addDays(`${indexMonth}-01`, -1))
    }
    const past = spec.points.filter((p) => p.day <= asOf)
    const usual = usualPrice(past, index, asOf, day)
    if (usual) deviations.push({ day, d: price / usual.value - 1 })
  }
  passes.push({ spec, priceDays, deviations })
}

// 카테고리 공통 구간의 재료: 그 카테고리 규격들의 편차를 모두 모은다
const pooled = new Map<string, number[]>()
for (const p of passes) pooled.set(p.spec.category, [...(pooled.get(p.spec.category) ?? []), ...p.deviations.map((x) => x.d)])

const results: SpecResult[] = []
for (const { spec, priceDays, deviations } of passes) {
  const ds = deviations.map((x) => x.d)
  const band = ds.length ? chooseBand(ds, pooled.get(spec.category) ?? []) : null
  const verdict = (d: number) => (band === null ? "none" : d < band.low ? "cheap" : d > band.high ? "expensive" : "normal")
  let flips = 0
  for (let i = 1; i < deviations.length; i++) if (verdict(deviations[i]!.d) !== verdict(deviations[i - 1]!.d)) flips++
  const shareOf = (test: (d: number) => boolean) => ds.filter(test).length / ds.length
  results.push({
    variety: spec.variety,
    spec: spec.spec,
    category: spec.category,
    priceDays,
    judged: ds.length,
    band,
    share: ds.length
      ? { cheap: shareOf((d) => verdict(d) === "cheap"), normal: shareOf((d) => verdict(d) === "normal"), expensive: shareOf((d) => verdict(d) === "expensive") }
      : null,
    p20: ds.length ? pct(ds, 0.2) : null,
    p50: ds.length ? pct(ds, 0.5) : null,
    p80: ds.length ? pct(ds, 0.8) : null,
    share10: ds.length
      ? {
          cheap: ds.filter((d) => d < -0.1).length / ds.length,
          normal: ds.filter((d) => d >= -0.1 && d <= 0.1).length / ds.length,
          expensive: ds.filter((d) => d > 0.1).length / ds.length,
        }
      : null,
    flips,
  })
}

const judged = results.filter((r) => r.judged > 0)
const coverage = results.reduce((a, r) => a + r.judged, 0) / Math.max(1, results.reduce((a, r) => a + r.priceDays, 0))
const r1 = (v: number) => Math.round(v * 1000) / 10
console.log(`기간 ${from} ~ ${to}, 규격 ${results.length}개 (시세가 있는 규격 ${results.filter((r) => r.priceDays > 0).length}개), ${Date.now() - started}ms`)
console.log(`평소가가 나온 규격 ${judged.length}개, 시세 있는 날 중 평소가가 나온 비율 ${r1(coverage)}%`)
console.log(`구간 폭(상위 20%): 중앙 ${r1(median(judged.map((r) => r.p80!))!)}%, 바닥 5%에 걸린 규격 ${judged.filter((r) => r.band!.high === SEASON_DEFAULTS.bandFloor).length}개, 천장 25%에 걸린 규격 ${judged.filter((r) => r.band!.high === SEASON_DEFAULTS.bandCeiling).length}개`)
const sh = judged.map((r) => r.share!)
const all = (k: "cheap" | "normal" | "expensive") => judged.reduce((a, r) => a + r.share![k] * r.judged, 0) / judged.reduce((a, r) => a + r.judged, 0)
console.log(`고른 구간으로: 싸요 ${r1(all("cheap"))}% · 보통 ${r1(all("normal"))}% · 비싸요 ${r1(all("expensive"))}% (판정한 날 전체), 규격별 중앙 ${r1(median(sh.map((s) => s.cheap))!)} · ${r1(median(sh.map((s) => s.normal))!)} · ${r1(median(sh.map((s) => s.expensive))!)}`)
console.log(`카테고리 공통 구간: ${[...pooled].map(([c, d]) => { const b = chooseBand([], d); return b ? `${c} ${r1(b.low)}~${r1(b.high)}%` : `${c} -` }).join(", ")}`)
const s10 = judged.map((r) => r.share10!)
console.log(`±10% 고정이면: 싸요 ${r1(median(s10.map((s) => s.cheap))!)}% · 보통 ${r1(median(s10.map((s) => s.normal))!)}% · 비싸요 ${r1(median(s10.map((s) => s.expensive))!)}% (규격별 중앙)`)
console.log(`편향(시세 ÷ 평소가 − 1의 규격별 중앙값): 중앙 ${r1(median(judged.map((r) => r.p50!))!)}%, |편향| > 5%인 규격 ${judged.filter((r) => Math.abs(r.p50!) > 0.05).length}개`)
console.log(`판정이 바뀐 횟수(1년, 규격별 중앙): ${median(judged.map((r) => r.flips))}`)
console.log("\n카테고리별 (규격 수, 상위 20% 폭 중앙, 편향 중앙, 평소가가 나온 비율)")
for (const cat of [...new Set(results.map((r) => r.category))].sort()) {
  const rs = results.filter((r) => r.category === cat)
  const js = rs.filter((r) => r.judged > 0)
  const cov = rs.reduce((a, r) => a + r.judged, 0) / Math.max(1, rs.reduce((a, r) => a + r.priceDays, 0))
  console.log(`  ${cat}: ${rs.length}개, 폭 ${js.length ? r1(median(js.map((r) => r.p80!))!) : "-"}%, 편향 ${js.length ? r1(median(js.map((r) => r.p50!))!) : "-"}%, 평소가 ${r1(cov)}%`)
}
const show = (r: SpecResult) =>
  `  ${r.variety}/${r.spec}: 하위 ${r1(r.p20!)}% 상위 ${r1(r.p80!)}% → 구간 ${r1(r.band!.low)}~${r1(r.band!.high)}%, 판정 ${r.judged}/${r.priceDays}일, 바뀜 ${r.flips}`
console.log("\n폭이 가장 넓은 규격")
for (const r of [...judged].sort((a, b) => b.p80! - a.p80!).slice(0, 8)) console.log(show(r))
console.log("폭이 가장 좁은 규격")
for (const r of [...judged].sort((a, b) => a.p80! - b.p80!).slice(0, 5)) console.log(show(r))
console.log("평소가가 안 나온 규격 (시세는 있음)")
for (const r of results.filter((r) => r.judged === 0 && r.priceDays > 0).slice(0, 15)) console.log(`  ${r.variety}/${r.spec}: 시세 ${r.priceDays}일`)
if (values.json) writeFileSync(values.json, JSON.stringify(results, null, 2))
