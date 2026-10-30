// 판정 배치 명령 (ingest-foundation/11, pipeline.md 3-4 · 4-3). 평소가(usual) 다음에 워크플로가 부른다.
//   pnpm --filter @workspace/price-ingest judgment [--trigger 이름] [--dry-run]
// 활성 품종마다 대표 규격(spec.is_default)의 판정 한 행을 새 묶음(judgment_batch)에 쓰고, 검사를 넘으면
// 포인터(judgment_current)를 바꾼다. 화면은 뷰 current_judgment로 바꾼 묶음만 읽는다.
// 소매 national 시세가 한 번도 없는 품종은 행을 만들지 않는다 (참가격만 있는 품종 등).
// 검사: 행이 하나도 없거나 지금 묶음보다 MIN_KEEP_RATIO 넘게 줄면 묶음을 failed로 두고 포인터는 그대로 둔다.
// 묶음은 최근 KEEP_BATCHES개와 지금 묶음만 남긴다.
// 환경변수: INGEST_DATABASE_URL. .env를 스스로 읽지 않는다.
import { parseArgs } from "node:util"

import type { JSONValue } from "postgres"

import { BASE_UNITS, VARIETIES, type BaseUnit } from "../catalog/varieties.ts"
import { connectIngest, type Tx } from "../load/db.ts"
import { actionsMaskCommands, describeError, redactorFromEnv, SECRET_ENV } from "../secrets.ts"
import { buildJudgment, type JudgmentInput } from "./build.ts"

const USAGE = "사용법: judgment [--trigger 이름] [--dry-run]"
const DRY_RUN = Symbol("dry-run")

export const KEEP_BATCHES = 7
export const MIN_KEEP_RATIO = 0.8
// 참가격 판매가는 보존 기간(6 조사일) 안의 가장 최근 조사일만 붙인다
const SHELF_DAYS = 42

type Key = { variety_id: number; spec_id: number; day: string }

// calc_param ekape.carried_over_days: 같은 값이 이어지면 갱신 지연으로 보는 날 수 (judgment.md 6-3). 조사일이 밀린 품종에도 쓴다
async function readStaleDays(tx: Tx): Promise<number> {
  const [row] = await tx<{ value: unknown; status: string }[]>`
    select value, status from price.calc_param where key = 'ekape.carried_over_days'`
  if (row?.status !== "decided" || typeof row.value !== "number") throw new Error("calc_param ekape.carried_over_days가 정한 숫자가 아니다")
  return row.value
}

const unitLabel = (baseUnit: string, qty: number): string =>
  (Object.entries(BASE_UNITS) as [BaseUnit, (typeof BASE_UNITS)[BaseUnit]][]).find(
    ([, u]) => u.base_unit === baseUnit && u.base_unit_qty === qty,
  )?.[0] ?? `${qty}${baseUnit}`

const group = <T extends { variety_id: number }>(rows: readonly T[]) => {
  const out = new Map<number, T[]>()
  for (const r of rows) out.set(r.variety_id, [...(out.get(r.variety_id) ?? []), r])
  return out
}

export async function readJudgmentInputs(tx: Tx): Promise<{ key: Key; input: JudgmentInput }[]> {
  const varieties = await tx<
    { variety_id: number; spec_id: number; slug: string; name: string; item: string; category: string; base_unit: string; base_unit_qty: string; spec_name: string; n_specs: number }[]
  >`
    select v.id as variety_id, s.id as spec_id, v.slug, v.name, i.name as item, c.name as category,
           v.base_unit, v.base_unit_qty::text, s.name as spec_name,
           (select count(*)::int from price.spec s2 where s2.variety_id = v.id) as n_specs
      from price.variety v
      join price.item i on i.id = v.item_id
      join price.category c on c.id = i.category_id
      join price.spec s on s.variety_id = v.id and s.is_default
     where v.status = 'active'
     order by v.id`
  const quotes = await tx<
    { variety_id: number; spec_id: number; day: string; price: number; n: number; min: number | null; max: number | null; meets_min_n: boolean | null; stale_days: number | null; sources: string[] }[]
  >`
    select distinct on (q.variety_id) q.variety_id, q.spec_id, q.obs_date::text as day, q.value::float8 as price, q.n,
           q.min::float8 as min, q.max::float8 as max, q.meets_min_n, q.stale_days, q.sources
      from price.daily_quote q
      join price.spec s on s.id = q.spec_id and s.is_default
     where q.basis = 'quote' and q.price_tier = 'retail' and q.scope_key = 'national'
     order by q.variety_id, q.obs_date desc`
  const quoteOf = new Map(quotes.map((q) => [q.variety_id, q]))
  const keys: Key[] = quotes.map((q) => ({ variety_id: q.variety_id, spec_id: q.spec_id, day: q.day }))
  if (keys.length === 0) return []
  const latestDay = quotes.map((q) => q.day).sort().at(-1)!
  const k = tx.json(keys)

  const usuals = await tx<{ variety_id: number; as_of: string; value: number; deviation: number | null; low: number | null; high: number | null }[]>`
    select distinct on (u.variety_id) u.variety_id, u.as_of::text, u.value::float8 as value,
           (u.components->>'deviation')::float8 as deviation,
           (u.components->'band'->>'low')::float8 as low, (u.components->'band'->>'high')::float8 as high
      from price.usual_price u
      join price.spec s on s.id = u.spec_id and s.is_default
     order by u.variety_id, u.as_of desc`
  const marketTypes = await tx<{ variety_id: number; type: string; median: number; n: number }[]>`
    select q.variety_id, substr(q.scope_key, length('market_type:') + 1) as type, q.value::float8 as median, q.n
      from jsonb_to_recordset(${k}) as k (variety_id int, spec_id int, day date)
      join price.daily_quote q
        on (q.variety_id, q.spec_id, q.obs_date) = (k.variety_id, k.spec_id, k.day)
       and q.basis = 'quote' and q.price_tier = 'retail' and q.scope_key like 'market_type:%'`
  // daily_quote의 시장 표본과 같은 행: 대표 출처의 매핑된 KAMIS 시장 표본, 이상치 제외 (load/daily-quote.ts)
  const samples = await tx<{ variety_id: number; market: string; market_type: string; sgg: string; price: number }[]>`
    select o.variety_id, mk.name as market, mk.market_type, mk.sgg_code_raw as sgg, o.price_per_base::float8 as price
      from jsonb_to_recordset(${k}) as k (variety_id int, spec_id int, day date)
      join price.observation o
        on (o.variety_id, o.spec_id, o.obs_date) = (k.variety_id, k.spec_id, k.day)
       and o.obs_kind = 'quote_sample' and o.price_tier = 'retail'
      join price.source_code_map m
        on m.source_item_id = o.source_item_id and m.status = 'mapped' and m.role = 'primary'
       and daterange(m.valid_from, m.valid_to) @> o.obs_date
      join price.market mk on mk.place_id = o.place_id
     where o.price_per_base is not null and not ('outlier' = any(coalesce(o.flags, '{}')))`
  const trend = await tx<{ variety_id: number; day: string; price: number; usual: number | null }[]>`
    select q.variety_id, q.obs_date::text as day, q.value::float8 as price, u.value::float8 as usual
      from jsonb_to_recordset(${k}) as k (variety_id int, spec_id int, day date)
      join price.daily_quote q
        on q.variety_id = k.variety_id and q.spec_id = k.spec_id
       and q.basis = 'quote' and q.price_tier = 'retail' and q.scope_key = 'national'
       and q.obs_date between k.day - 182 and k.day
      left join price.usual_price u on (u.variety_id, u.spec_id, u.as_of) = (q.variety_id, q.spec_id, q.obs_date)
     order by q.variety_id, q.obs_date`
  const shelf = await tx<{ variety_id: number; day: string; seller: string; price: number; promo: boolean; promo_to: string | null }[]>`
    with last as (
      select k.variety_id, k.spec_id,
             (select max(o.obs_date) from price.observation o
               where o.variety_id = k.variety_id and o.spec_id = k.spec_id and o.obs_kind = 'shelf_price'
                 and o.obs_date > ${latestDay}::date - ${SHELF_DAYS}::int) as day
        from jsonb_to_recordset(${k}) as k (variety_id int, spec_id int, day date)
    )
    select o.variety_id, l.day::text, se.name as seller, o.price_per_base::float8 as price,
           coalesce(o.promo_discount, false) or coalesce(o.promo_one_plus_one, false) as promo, o.promo_to::text
      from last l
      join price.observation o
        on (o.variety_id, o.spec_id, o.obs_date) = (l.variety_id, l.spec_id, l.day) and o.obs_kind = 'shelf_price'
      join price.store_seller ss on ss.place_id = o.place_id and daterange(ss.valid_from, ss.valid_to) @> o.obs_date
      join price.seller se on se.id = ss.seller_id
     where o.price_per_base is not null and not ('outlier' = any(coalesce(o.flags, '{}')))`

  const usualOf = new Map(usuals.map((u) => [u.variety_id, u]))
  const marketTypesOf = group(marketTypes)
  const samplesOf = group(samples)
  const trendOf = group(trend)
  const shelfOf = group(shelf)
  const spreadOf = new Map(VARIETIES.map((v) => [v.slug, v.spread]))

  const out: { key: Key; input: JudgmentInput }[] = []
  for (const v of varieties) {
    const q = quoteOf.get(v.variety_id)
    if (!q) continue
    const u = usualOf.get(v.variety_id)
    const shelfRows = shelfOf.get(v.variety_id) ?? []
    const sellers = new Map<string, { price: number; promo: boolean; promoTo: string | null }[]>()
    for (const r of shelfRows) sellers.set(r.seller, [...(sellers.get(r.seller) ?? []), { price: r.price, promo: r.promo, promoTo: r.promo_to }])
    const spread = spreadOf.get(v.slug)
    out.push({
      key: { variety_id: v.variety_id, spec_id: v.spec_id, day: q.day },
      input: {
        variety: {
          slug: v.slug,
          name: v.name,
          item: v.item,
          category: v.category,
          baseUnit: unitLabel(v.base_unit, Number(v.base_unit_qty)),
          spec: v.n_specs > 1 ? v.spec_name : null,
          ...(spread ? { spread } : {}),
        },
        latestDay,
        quote: { day: q.day, price: q.price, n: q.n, min: q.min, max: q.max, meetsMinN: q.meets_min_n, staleDays: q.stale_days, sources: q.sources },
        usual: u ? { asOf: u.as_of, value: u.value, deviation: u.deviation, band: u.low !== null && u.high !== null ? { low: u.low, high: u.high } : null } : null,
        marketTypes: marketTypesOf.get(v.variety_id) ?? [],
        samples: (samplesOf.get(v.variety_id) ?? []).map((s) => ({ market: s.market, marketType: s.market_type, sgg: s.sgg, price: s.price })),
        trend: (trendOf.get(v.variety_id) ?? []).map((t) => ({ day: t.day, price: t.price, usual: t.usual })),
        shelf: shelfRows.length > 0 ? { day: shelfRows[0]!.day, sellers: [...sellers].map(([seller, prices]) => ({ seller, prices })) } : null,
      },
    })
  }
  return out
}

export type JudgmentResult = {
  batchId: number
  status: "ready" | "failed"
  rows: number
  previousRows: number | null
  verdicts: Record<"cheap" | "normal" | "expensive" | "none", number>
  note: string | null
}

// 트랜잭션 안에서 부른다
export async function writeJudgment(tx: Tx, input: { trigger: string }): Promise<JudgmentResult> {
  await tx`select pg_advisory_xact_lock(hashtext('recompute:judgment'))`
  const staleDays = await readStaleDays(tx)
  const built = (await readJudgmentInputs(tx)).map(({ key, input: i }) => ({ key, ...buildJudgment(i, { staleDays }) }))

  const [batch] = await tx<{ id: string }[]>`
    insert into price.judgment_batch (started_at, status, trigger) values (now(), 'building', ${input.trigger}) returning id`
  const batchId = Number(batch!.id)
  if (built.length > 0) {
    await tx`
      insert into price.judgment_snapshot (batch_id, variety_id, spec_id, as_of, today_price, usual, verdict, diff_pct, payload)
      select ${batchId}, r.variety_id, r.spec_id, r.as_of, r.today_price, r.usual, r.verdict, r.diff_pct, r.payload
        from jsonb_to_recordset(${tx.json(
          built.map((b) => ({
            variety_id: b.key.variety_id,
            spec_id: b.key.spec_id,
            as_of: b.row.asOf,
            today_price: b.row.todayPrice,
            usual: b.row.usual,
            verdict: b.row.verdict,
            diff_pct: b.row.diffPct,
            payload: b.payload,
          })) as unknown as JSONValue, // VarietyDetail의 readonly 배열은 postgres의 JSONValue 타입에 맞지 않는다
        )}) as r (variety_id int, spec_id int, as_of date, today_price numeric, usual numeric, verdict text, diff_pct numeric, payload jsonb)`
  }

  const [current] = await tx<{ rows: number }[]>`
    select count(*)::int as rows from price.current_judgment`
  const previousRows = current && current.rows > 0 ? current.rows : null
  const note =
    built.length === 0
      ? "판정 행이 없다"
      : previousRows !== null && built.length < previousRows * MIN_KEEP_RATIO
        ? `판정 행이 ${previousRows} → ${built.length}로 줄었다`
        : null
  const verdicts = { cheap: 0, normal: 0, expensive: 0, none: 0 }
  for (const b of built) verdicts[b.row.verdict ?? "none"]++

  if (note) {
    await tx`update price.judgment_batch set status = 'failed', finished_at = now(), note = ${note} where id = ${batchId}`
  } else {
    await tx`update price.judgment_batch set status = 'ready', finished_at = now() where id = ${batchId}`
    await tx`
      insert into price.judgment_current (batch_id, swapped_at) values (${batchId}, now())
      on conflict (singleton) do update set batch_id = excluded.batch_id, swapped_at = excluded.swapped_at`
  }
  await tx`
    delete from price.judgment_batch b
     where b.id not in (select id from price.judgment_batch order by id desc limit ${KEEP_BATCHES})
       and b.id not in (select batch_id from price.judgment_current)`
  return { batchId, status: note ? "failed" : "ready", rows: built.length, previousRows, verdicts, note }
}

async function main(): Promise<void> {
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const line of actionsMaskCommands(SECRET_ENV.map((name) => process.env[name]))) console.log(line)
  }
  const { values } = parseArgs({ options: { trigger: { type: "string" }, "dry-run": { type: "boolean" } }, strict: true })
  const trigger = values.trigger ?? "manual"
  if (!/^[a-z0-9_-]{1,32}$/.test(trigger)) throw new Error(`--trigger는 영문 소문자 · 숫자 · _ · - 32자까지다. ${USAGE}`)
  const url = process.env.INGEST_DATABASE_URL
  if (!url) throw new Error("환경변수 INGEST_DATABASE_URL가 없다")
  const sql = connectIngest(url)
  let failed = false
  try {
    await sql.begin(async (tx) => {
      const r = await writeJudgment(tx, { trigger })
      const v = r.verdicts
      console.log(
        `판정 묶음 ${r.batchId}: ${r.status}, 행 ${r.rows} (지금 묶음 ${r.previousRows ?? "없음"}), 싸요 ${v.cheap} · 보통 ${v.normal} · 비싸요 ${v.expensive} · 판정 전 ${v.none}`,
      )
      if (r.note) console.error(`포인터를 바꾸지 않았다: ${r.note}`)
      failed = r.status === "failed"
      if (values["dry-run"]) throw DRY_RUN
    })
  } catch (error) {
    if (error !== DRY_RUN) throw error
    console.log("--dry-run: 되돌렸다")
  } finally {
    await sql.end()
  }
  if (failed) process.exitCode = 1
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(describeError(error, redactorFromEnv()))
    process.exitCode = 1
  })
}
