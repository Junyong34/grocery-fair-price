// 평소가 명령 (judgment.md 1·2장, 로드맵 ②). KAMIS 정기 수집 뒤에 워크플로가 부른다.
//   pnpm --filter @workspace/price-ingest usual [--to YYYY-MM-DD] [--days N] [--dry-run]
// 소매 national 시세(daily_quote, basis quote)를 읽고, to(기본: 시세가 있는 마지막 날)까지 days일(기본 7)의 평소가를 usual_price에,
// to 기준 계절비율을 season_index에 쓴다. 차트에 쓸 6개월을 처음 채울 때는 --days 182.
// 기간 안의 평소가 행은 새 결과로 맞춘다 (판정 전이 된 날의 행은 지운다). 계절비율은 표 전체를 새 판으로 바꾼다.
// 환경변수: INGEST_DATABASE_URL. .env를 스스로 읽지 않는다.
import { parseArgs } from "node:util"

import { addDays } from "../ingest/collect.ts"
import { connectIngest, type Sql, type Tx } from "../load/db.ts"
import { actionsMaskCommands, describeError, redactorFromEnv, SECRET_ENV } from "../secrets.ts"
import { computeUsual, SEASON_METHOD, USUAL_METHOD, type SpecSeries } from "./compute.ts"

const USAGE = "사용법: usual [--to YYYY-MM-DD] [--days N] [--dry-run]"
const DRY_RUN = Symbol("dry-run")

export async function readSeries(sql: Sql | Tx, to: string): Promise<SpecSeries[]> {
  const rows = await sql<{ variety_id: number; spec_id: number; category: string; day: string; price: string }[]>`
    select q.variety_id, q.spec_id, c.slug as category, q.obs_date::text as day, q.value::text as price
      from price.daily_quote q
      join price.variety v on v.id = q.variety_id
      join price.item i on i.id = v.item_id
      join price.category c on c.id = i.category_id
     where q.basis = 'quote' and q.price_tier = 'retail' and q.scope_key = 'national' and q.obs_date <= ${to}
     order by q.variety_id, q.spec_id, q.obs_date`
  const out = new Map<string, SpecSeries & { points: { day: string; price: number }[] }>()
  for (const r of rows) {
    const key = `${r.variety_id}|${r.spec_id}`
    const s = out.get(key) ?? { varietyId: r.variety_id, specId: r.spec_id, category: r.category, points: [] }
    s.points.push({ day: r.day, price: Number(r.price) })
    out.set(key, s)
  }
  return [...out.values()]
}

export type UsualResult = { from: string; to: string; specs: number; usualRows: number; removed: number; seasonRows: number }

// 트랜잭션 안에서 부른다
export async function writeUsual(tx: Tx, input: { to?: string; days: number }): Promise<UsualResult> {
  await tx`select pg_advisory_xact_lock(hashtext('recompute:usual'))`
  const [last] = await tx<{ day: string | null }[]>`
    select max(obs_date)::text as day from price.daily_quote where basis = 'quote' and price_tier = 'retail' and scope_key = 'national'`
  const to = input.to ?? last?.day
  if (!to) throw new Error("소매 national 시세가 없다")
  const from = addDays(to, -(input.days - 1))
  const series = await readSeries(tx, to)
  const { usual, season } = computeUsual(series, { from, to })

  const removed = await tx`
    delete from price.usual_price where method = ${USUAL_METHOD} and as_of between ${from} and ${to}`
  if (usual.length > 0) {
    await tx`
      insert into price.usual_price (variety_id, spec_id, as_of, value, method, components)
      select r.variety_id, r.spec_id, r.as_of, round(r.value, 2), ${USUAL_METHOD}, r.components
        from jsonb_to_recordset(${tx.json(usual.map((u) => ({ variety_id: u.varietyId, spec_id: u.specId, as_of: u.asOf, value: u.value, components: u.components })))})
             as r (variety_id int, spec_id int, as_of date, value numeric, components jsonb)`
  }
  // 지금 쓰는 판 하나만 둔다. 시세가 없어진 품종·규격의 옛 판도 지운다
  await tx`delete from price.season_index`
  if (season.length > 0) {
    await tx`
      insert into price.season_index (variety_id, spec_id, slot, value, n, as_of, method, computed_at)
      select r.variety_id, r.spec_id, r.slot, round(r.value, 4), r.n, r.as_of, ${SEASON_METHOD}, now()
        from jsonb_to_recordset(${tx.json(season.map((s) => ({ variety_id: s.varietyId, spec_id: s.specId, slot: s.slot, value: s.value, n: s.n, as_of: s.asOf })))})
             as r (variety_id int, spec_id int, slot int, value numeric, n int, as_of date)`
  }
  return { from, to, specs: new Set(usual.map((u) => `${u.varietyId}|${u.specId}`)).size, usualRows: usual.length, removed: removed.count, seasonRows: season.length }
}

async function main(): Promise<void> {
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const line of actionsMaskCommands(SECRET_ENV.map((name) => process.env[name]))) console.log(line)
  }
  const { values } = parseArgs({ options: { to: { type: "string" }, days: { type: "string" }, "dry-run": { type: "boolean" } }, strict: true })
  if (values.to !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(values.to)) throw new Error(`--to는 YYYY-MM-DD다. ${USAGE}`)
  const days = values.days === undefined ? 7 : Number(values.days)
  if (!Number.isInteger(days) || days < 1 || days > 400) throw new Error(`--days는 1~400이다. ${USAGE}`)
  const url = process.env.INGEST_DATABASE_URL
  if (!url) throw new Error("환경변수 INGEST_DATABASE_URL가 없다")
  const sql = connectIngest(url)
  try {
    await sql.begin(async (tx) => {
      const r = await writeUsual(tx, { to: values.to, days })
      console.log(
        `평소가: ${r.from} ~ ${r.to}, 평소가가 나온 규격 ${r.specs}개, 행 ${r.usualRows} (지운 옛 행 ${r.removed}), 계절비율 ${r.seasonRows}행`,
      )
      if (values["dry-run"]) throw DRY_RUN
    })
  } catch (error) {
    if (error !== DRY_RUN) throw error
    console.log("--dry-run: 되돌렸다")
  } finally {
    await sql.end()
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(describeError(error, redactorFromEnv()))
    process.exitCode = 1
  })
}
