import { existsSync } from "node:fs"

import { connectIngest } from "../src/load/db.ts"
import { errorSummary, redactorFromEnv } from "../src/secrets.ts"

const envFile = new URL("../../../.env", import.meta.url)
if (!process.env.INGEST_DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile)

async function main() {
  const [variety, reference, extra] = process.argv.slice(2)
  if (!variety || extra) throw new Error("사용법: check:spec-prices <품종 slug> [비교 규격 slug]")
  const url = process.env.INGEST_DATABASE_URL
  if (!url) throw new Error("INGEST_DATABASE_URL이 없다")
  const sql = connectIngest(url)

  try {
    const rows = await sql.begin("read only", async (tx) => {
      await tx`set local statement_timeout = '10s'`
      if (reference) {
        const [found] = await tx`
          select 1 from price.spec s join price.variety v on v.id = s.variety_id
           where v.slug = ${variety} and s.slug = ${reference}
        `
        if (!found) throw new Error("비교 규격을 이 품종에서 찾을 수 없다")
      }

      return tx`
        with observations as (
          select o.*, si.source, si.source_key, s.slug as spec, v.base_unit, v.base_unit_qty
            from price.variety v
            join price.observation o on o.variety_id = v.id
            join price.spec s on s.id = o.spec_id
            join price.source_item si on si.id = o.source_item_id
            join price.obs_place p on p.id = o.place_id
           where v.slug = ${variety} and o.price_tier = 'retail'
             and o.obs_date between (now() at time zone 'Asia/Seoul')::date - 29
                                and (now() at time zone 'Asia/Seoul')::date
             and (o.obs_kind = 'quote_sample' or (o.obs_kind = 'quote_aggregate' and p.scope = 'national'))
        ), latest as (
          select spec_id, max(obs_date) as day from observations group by spec_id
        ), samples as (
          select distinct on (o.source_item_id) o.*
            from observations o
            join latest l on (l.spec_id, l.day) = (o.spec_id, o.obs_date)
           order by o.source_item_id, (o.obs_kind = 'quote_aggregate') desc, o.place_id
        ), source_values as (
          select spec_id, obs_date, source,
                 percentile_cont(0.5) within group (order by price_per_base) as median
            from samples
           where obs_kind = 'quote_aggregate' and price_per_base > 0
           group by spec_id, obs_date, source
        ), source_gap as (
          select spec_id, obs_date from source_values
           group by spec_id, obs_date
          having count(*) > 1 and max(median) >= 3 * min(median)
        )
        select o.spec as 규격, o.obs_date::text as 조사일, o.source_key as 원천_키,
               o.obs_kind as 관측_종류, o.price_raw as 원천_금액, o.qty_raw as 원천_수량,
               o.unit_raw as 원천_단위, concat(o.base_unit_qty, ' ', o.base_unit) as 기준_단위,
               o.price_per_base as 관측_환산가, q.value as 전국_시세,
               r.value as 비교_규격_시세,
               concat_ws(', ',
                 case when o.price_per_base is null then '환산가 없음' end,
                 case when g.spec_id is not null then '같은 규격의 출처별 전국 값 3배 이상 차이' end,
                 case when q.value > 0 and r.value > 0 and greatest(q.value, r.value) >= 3 * least(q.value, r.value)
                   then '같은 날 시세 3배 이상 차이' end,
                 nullif(array_to_string(o.flags, ', '), '')
               ) as 확인
          from samples o
          left join source_gap g on (g.spec_id, g.obs_date) = (o.spec_id, o.obs_date)
          left join price.daily_quote q
            on (q.variety_id, q.spec_id, q.obs_date) = (o.variety_id, o.spec_id, o.obs_date)
           and (q.price_tier, q.basis, q.scope_key) = ('retail', 'quote', 'national')
          left join price.spec s on s.variety_id = o.variety_id and s.slug = ${reference ?? null}
          left join price.daily_quote r
            on (r.variety_id, r.spec_id, r.obs_date) = (o.variety_id, s.id, o.obs_date)
           and (r.price_tier, r.basis, r.scope_key) = ('retail', 'quote', 'national')
         order by o.spec, o.source, o.source_key
      `
    })
    if (!rows.length) throw new Error("최근 30일에 검산할 소매 관측값이 없다")
    console.table([...rows])
  } finally {
    await sql.end({ timeout: 1 })
  }
}

main().catch((error: unknown) => {
  console.error(errorSummary(error, redactorFromEnv()))
  process.exitCode = 1
})
