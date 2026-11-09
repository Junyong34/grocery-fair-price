import "server-only"

import type { VerdictKind } from "@workspace/price/types"
import { FOODS } from "@workspace/seasonal/data/foods"

import { seasonalCoverage, summarize, type SeasonalGroup, type Summary, type VarietyRow } from "../lib/variety-view"
import { readerDb } from "./reader-db"

// 식재료 목록 어드민의 읽기 (catalog-scale/07). 읽기 전용 트랜잭션에서 읽는다 (접속은 reader-db.ts).

export type PendingKey = {
  source: "kamis" | "ekape"
  key: string // source_item.source_key
  label: string | null // 원문 이름 (KAMIS `품목/품종/등급`)
  firstSeen: string
  lastSeen: string
  observations: number // 남아 있는 관측값 수 (지금 이으면 다시 매핑될 행)
}

export type PendingProduct = { goodId: string; name: string; alCode: string | null; reason: string | null }

export type VarietyCatalog = {
  rows: VarietyRow[]
  pendingKeys: PendingKey[]
  pendingProducts: PendingProduct[]
  ignoredProducts: number // 규칙이 없어 ignored로 둔 참가격 상품 (대부분 가공식품)
  seasonal: SeasonalGroup[]
  summary: Summary
  judgedAt: string | null // 지금 공개된 판정 묶음을 만든 시각
}

export async function getVarietyCatalog(): Promise<VarietyCatalog> {
  return readerDb().begin("read only", async (sql) => {
    const varieties = await sql<
      { slug: string; name: string; status: "active" | "hidden"; category: string; item: string; specs: number; kamis: number; ekape: number; chamga: number; seasonal: string[] }[]
    >`
      select v.slug, v.name, v.status, c.name as category, i.name as item,
             (select count(*)::int from price.spec s where s.variety_id = v.id) as specs,
             (select count(*)::int from price.catalog_key_rule r where r.variety_id = v.id and r.source = 'kamis') as kamis,
             (select count(*)::int from price.catalog_key_rule r where r.variety_id = v.id and r.source = 'ekape') as ekape,
             (select count(*)::int from price.catalog_key_rule r where r.variety_id = v.id and r.source = 'chamga') as chamga,
             coalesce((select array_agg(m.seasonal_food_id order by m.seasonal_food_id) from price.variety_seasonal_map m where m.variety_id = v.id), '{}') as seasonal
        from price.variety v
        join price.item i on i.id = v.item_id
        join price.category c on c.id = i.category_id
       order by c.sort nulls last, c.id, v.sort nulls last, v.id`

    const judgments = await sql<{ slug: string; verdict: VerdictKind; pct: number | null; surveyed_on: string }[]>`
      select payload->>'id' as slug, payload->'verdict'->>'kind' as verdict,
             (payload->'verdict'->>'pct')::float8 as pct, payload->>'surveyedOn' as surveyed_on
        from price.current_judgment`
    const [batch] = await sql<{ finished_at: string | null }[]>`
      select b.finished_at::text from price.judgment_current c join price.judgment_batch b on b.id = c.batch_id limit 1`

    const pendingKeys = await sql<{ source: "kamis" | "ekape"; key: string; label: string | null; first_seen: string; last_seen: string; observations: number }[]>`
      select si.source, si.source_key as key, si.label, si.first_seen_on::text as first_seen, si.last_seen_on::text as last_seen,
             (select count(*)::int from price.observation o where o.source_item_id = si.id) as observations
        from price.source_item si
        join price.source_code_map m on m.source_item_id = si.id and m.valid_to is null
       where m.status = 'pending'
       order by si.last_seen_on desc, si.source_key`

    const pendingProducts = await sql<{ good_id: string; name: string; al_code: string | null; reason: string | null }[]>`
      select si.key_parts->>'goodId' as good_id, p.name, h.al_code, r.reason
        from price.product p
        join price.product_variety_map pm on pm.product_id = p.id and pm.valid_to is null and pm.status = 'pending'
        join price.product_source_key k on k.product_id = p.id and k.valid_to is null
        join price.source_item si on si.id = k.source_item_id
        left join lateral (select al_code from price.product_attr_history x where x.product_id = p.id order by x.valid_from desc limit 1) h on true
        left join price.catalog_key_rule r on r.source = 'chamga' and r.key_pattern = si.key_parts->>'goodId'
       order by p.name`
    const [ignored] = await sql<{ n: number }[]>`
      select count(*)::int as n from price.product_variety_map where valid_to is null and status = 'ignored'`

    const judgmentOf = new Map(judgments.map((j) => [j.slug, j]))
    const rows: VarietyRow[] = varieties.map((v) => {
      const j = judgmentOf.get(v.slug)
      return {
        slug: v.slug,
        name: v.name,
        status: v.status,
        category: v.category,
        item: v.item,
        specs: v.specs,
        keys: { kamis: v.kamis, ekape: v.ekape, chamga: v.chamga },
        seasonal: v.seasonal,
        judgment: j ? { verdict: j.verdict, pct: j.pct, surveyedOn: j.surveyed_on } : null,
      }
    })
    return {
      rows,
      pendingKeys: pendingKeys.map((p) => ({ source: p.source, key: p.key, label: p.label, firstSeen: p.first_seen, lastSeen: p.last_seen, observations: p.observations })),
      pendingProducts: pendingProducts.map((p) => ({ goodId: p.good_id, name: p.name, alCode: p.al_code, reason: p.reason })),
      ignoredProducts: ignored?.n ?? 0,
      seasonal: seasonalCoverage(rows, FOODS.map((f) => ({ id: f.id, name: f.name, category: f.category }))),
      summary: summarize(rows, pendingKeys.length + pendingProducts.length),
      judgedAt: batch?.finished_at ?? null,
    }
  })
}
