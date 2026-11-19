import type { Sql, TransactionSql } from "postgres"

export type VarietySpecQuote = {
  slug: string
  name: string
  surveyedOn: string
  price: number | null
  sources: string[]
}

/** 활성 품종의 규격마다 최신 전국 소매 시세 한 건을 읽는다. 대표 규격을 먼저 보여 준다. */
export async function readVarietySpecQuotes(
  sql: Sql | TransactionSql,
  variety: string,
): Promise<VarietySpecQuote[]> {
  return sql<VarietySpecQuote[]>`
    select s.slug, s.name, q.obs_date::text as "surveyedOn", q.value::float8 as price, q.sources
      from price.variety v
      join price.spec s on s.variety_id = v.id
      join lateral (
        select obs_date, value, sources
          from price.daily_quote
         where variety_id = v.id and spec_id = s.id
           and basis = 'quote' and price_tier = 'retail' and scope_key = 'national'
         order by obs_date desc
         limit 1
      ) q on true
     where v.slug = ${variety} and v.status = 'active'
     order by s.is_default desc, s.sort nulls last, s.slug
  `
}
