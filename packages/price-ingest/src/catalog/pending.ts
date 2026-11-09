// 카탈로그 제안 흐름의 DB 쪽 (catalog-scale/06).
//   listPending: 아직 규격에 잇지 않은 원천 키(KAMIS·축평원)와 참가격 상품을 제안할 거리로 내보낸다. 읽기만 한다
//   insertProposals: 제안 파일을 catalog_proposal에 proposed로 넣는다. 소유자 접속으로만 쓴다(ingest_writer는 읽기만).
//     승인 전에는 매핑·화면에 영향이 없다. 같은 원천 키에 열린 제안이 있으면 덮지 않고 넘긴다
import type { Sql, Tx } from "../load/db.ts"

import { readRules } from "./db.ts"
import { keyPatternOf, recentEnough, similarVarieties, type CatalogVarietyRef, type ProposalEntry, type SimilarVarieties } from "./proposal.ts"
import type { Source } from "./rules.ts"

type Db = Sql | Tx

export type PendingEntry = {
  source: Source
  key: string // catalog_key_rule.key_pattern 표기
  label: string | null // 원문 이름 (KAMIS `품목/품종/등급`, 참가격 상품명)
  units: string[] // 관측된 단위 (KAMIS·축평원 `1 마리`), 참가격은 상품 용량 (`200 g`)
  sourceCategory: string | null // 출처 분류: KAMIS 부류 코드, 축평원 축종, 참가격 AL 소분류
  category: { slug: string; name: string; className: string; note: string | null } | null // 출처 분류 대응표(05)가 정한 카테고리. 대응이 없으면 null
  firstSeen: string
  lastSeen: string
  observations: number // 남은 관측값 수 (KAMIS는 90일 뒤 지워진다)
  hold: string | null // 보류 규칙이 있으면 그 이유
  openProposal: number | null // 열린 제안(proposed·approved) 번호. 있으면 새 제안을 넣지 않는다
  mapStatus: "pending" | "ignored" // 지금 매핑 상태. ignored는 규칙 없이 잇지 않은 참가격 상품(대부분 가공식품, --include-ignored)
  productItem: string | null // 참가격 상품이 이미 속한 품목 slug (product.item_id). 없으면 null
  similar: SimilarVarieties
}

type Row = {
  map_status: "pending" | "ignored"
  product_item: string | null
  source: Source
  key_parts: Record<string, string>
  label: string | null
  units: string[] | null
  source_category: string | null
  first_seen: string
  last_seen: string
  observations: number
}

// includeIgnored: 품종에 잇지 않기로 한(ignored) 참가격 상품도 낸다. 가공식품의 품목을 제안할 때 쓴다 (catalog-scale/06)
export async function listPending(
  tx: Db,
  { source, sinceDays, today, includeIgnored = false }: { source?: Source; sinceDays?: number; today: string; includeIgnored?: boolean },
): Promise<PendingEntry[]> {
  const productStatuses = includeIgnored ? ["pending", "ignored"] : ["pending"]
  const keyRows = await tx<Row[]>`
    select si.source, si.key_parts, si.label, m.status as map_status, null::text as product_item,
           coalesce(si.key_parts->>'ctgry_cd', si.key_parts->>'judgeKind') as source_category,
           si.first_seen_on::text as first_seen, si.last_seen_on::text as last_seen,
           (select array_agg(distinct concat_ws(' ', o.qty_raw::text, o.unit_raw) order by concat_ws(' ', o.qty_raw::text, o.unit_raw))
              from price.observation o where o.source_item_id = si.id) as units,
           (select count(*)::int from price.observation o where o.source_item_id = si.id) as observations
      from price.source_item si
      join price.source_code_map m on m.source_item_id = si.id and m.valid_to is null
     where m.status = 'pending'`
  const productRows = await tx<Row[]>`
    select 'chamga' as source, si.key_parts, p.name as label, h.al_code as source_category, pm.status as map_status, pi.slug as product_item,
           array[concat_ws(' ', h.total_qty::text, h.total_unit)] as units,
           p.registered_on::text as first_seen, coalesce(p.last_price_on, p.registered_on)::text as last_seen,
           (select count(*)::int from price.observation o where o.source_item_id = si.id) as observations
      from price.product p
      join price.product_variety_map pm on pm.product_id = p.id and pm.valid_to is null and pm.status = any(${productStatuses})
      left join price.item pi on pi.id = p.item_id
      join price.product_source_key k on k.product_id = p.id and k.valid_to is null
      join price.source_item si on si.id = k.source_item_id
      left join lateral (
        select x.al_code, x.total_qty, x.total_unit from price.product_attr_history x where x.product_id = p.id order by x.valid_from desc limit 1
      ) h on true`
  const open = await tx<{ source: Source; key: string; id: number }[]>`
    select source, key_pattern as key, id::int from price.catalog_proposal where status in ('proposed', 'approved')`
  const varieties = await tx<CatalogVarietyRef[]>`
    select v.slug, v.name, i.slug as item, i.name as "itemName",
           coalesce((select array_agg(s.slug order by s.is_default desc, s.sort nulls last, s.id) from price.spec s where s.variety_id = v.id), '{}') as specs
      from price.variety v join price.item i on i.id = v.item_id
     where v.status = 'active'
     order by v.sort nulls last, v.id`
  const rules = await readRules(tx)
  const categoryRows = await tx<{ source: Source; code: string; slug: string; name: string; class_name: string; note: string | null }[]>`
    select m.source, m.source_class as code, c.slug, c.name, m.class_name, m.note
      from price.category_source_map m join price.category c on c.id = m.category_id`
  const categoryOf = new Map(categoryRows.map((r) => [`${r.source}:${r.code}`, { slug: r.slug, name: r.name, className: r.class_name, note: r.note }]))
  const holdOf = new Map(rules.filter((r) => r.action === "hold").map((r) => [`${r.source}:${r.key}`, r.reason]))
  const openOf = new Map(open.map((p) => [`${p.source}:${p.key}`, p.id]))

  return [...keyRows, ...productRows]
    .filter((r) => (source === undefined || r.source === source) && recentEnough(r.last_seen, today, sinceDays))
    .map((r): PendingEntry => {
      const key = keyPatternOf(r.source, r.key_parts)
      const id = `${r.source}:${key}`
      return {
        source: r.source,
        key,
        label: r.label,
        units: r.units ?? [],
        sourceCategory: r.source_category,
        category: r.source_category === null ? null : (categoryOf.get(`${r.source}:${r.source_category}`) ?? null),
        firstSeen: r.first_seen,
        lastSeen: r.last_seen,
        observations: r.observations,
        hold: holdOf.get(id) ?? null,
        openProposal: openOf.get(id) ?? null,
        mapStatus: r.map_status,
        productItem: r.product_item,
        similar: similarVarieties({ source: r.source, key, label: r.label }, varieties, rules),
      }
    })
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen) || a.source.localeCompare(b.source) || a.key.localeCompare(b.key))
}

export type ProposeResult = { inserted: { id: number; source: Source; key: string }[]; skipped: { source: Source; key: string; openProposal: number }[] }

// 제안이 가리키는 원천 키·품목·품종·규격이 DB에 있는지, 새로 만들 slug가 이미 있지 않은지 본다. 틀린 것을 모두 모아 멈춘다
async function checkReferences(tx: Tx, entries: readonly ProposalEntry[]): Promise<void> {
  const keys = await tx<{ source: Source; key_parts: Record<string, string> }[]>`
    select source, key_parts from price.source_item where source = any(${[...new Set(entries.map((e) => e.source))]})`
  const known = new Set(keys.map((k) => `${k.source}:${keyPatternOf(k.source, k.key_parts)}`))
  const itemRows = await tx<{ slug: string; name: string; category: string }[]>`
    select i.slug, i.name, c.slug as category from price.item i join price.category c on c.id = i.category_id`
  const items = new Map(itemRows.map((r) => [r.slug, `${r.name}|${r.category}`]))
  const categories = new Set((await tx<{ slug: string }[]>`select slug from price.category`).map((r) => r.slug))
  const newItems = new Map<string, string>() // 이 파일이 새로 만들 품목. 같은 slug는 같은 이름·카테고리여야 한다
  const specRows = await tx<{ variety: string; spec: string }[]>`
    select v.slug as variety, s.slug as spec from price.variety v left join price.spec s on s.variety_id = v.id`
  const varieties = new Set(specRows.map((r) => r.variety))
  const specs = new Set(specRows.map((r) => `${r.variety}/${r.spec}`))

  const problems: string[] = []
  for (const e of entries) {
    const id = `${e.source}:${e.key}`
    const p = e.proposal as Record<string, unknown> & { variety?: unknown; spec?: unknown; item?: unknown }
    const need = (ok: boolean, what: string) => {
      if (!ok) problems.push(`${id} (${e.kind}): ${what}`)
    }
    need(known.has(id), "원천 키가 DB에 없다")
    // 품목: slug면 있어야 하고, 새 품목이면 카테고리가 있고 같은 slug의 품목이 있으면 이름·카테고리가 같아야 한다
    const checkItem = (ref: unknown) => {
      if (typeof ref === "string") return need(items.has(ref), `품목 ${ref}이 없다`)
      const item = ref as { slug: string; name: string; category: string }
      const def = `${item.name}|${item.category}`
      need(categories.has(item.category), `카테고리 ${item.category}가 없다`)
      need((items.get(item.slug) ?? newItems.get(item.slug) ?? def) === def, `품목 ${item.slug}이 이미 다른 이름·카테고리로 있다`)
      newItems.set(item.slug, def)
    }
    if (e.kind === "map" || e.kind === "merge") need(specs.has(`${String(p.variety)}/${String(p.spec)}`), `규격 ${String(p.variety)}/${String(p.spec)}이 없다`)
    if (e.kind === "new_spec") {
      const spec = p.spec as { slug: string }
      need(varieties.has(String(p.variety)), `품종 ${String(p.variety)}이 없다`)
      need(!specs.has(`${String(p.variety)}/${spec.slug}`), `규격 ${String(p.variety)}/${spec.slug}이 이미 있다`)
    }
    if (e.kind === "new_variety") {
      checkItem(p.item)
      need(!varieties.has((p.variety as { slug: string }).slug), `품종 ${(p.variety as { slug: string }).slug}이 이미 있다`)
    }
    if (e.kind === "product_item") {
      need(e.source === "chamga", "상품의 품목은 참가격 상품에만 정한다")
      checkItem(p.item)
      if (p.variety !== undefined) need(varieties.has(String(p.variety)), `품종 ${String(p.variety)}이 없다`)
      if (p.spec !== undefined) need(specs.has(`${String(p.variety)}/${String(p.spec)}`), `규격 ${String(p.variety)}/${String(p.spec)}이 없다`)
    }
  }
  if (problems.length > 0) throw new Error(`제안 파일을 넣지 않았다:\n${problems.join("\n")}`)
}

export async function insertProposals(tx: Tx, entries: readonly ProposalEntry[], proposedBy: string): Promise<ProposeResult> {
  await checkReferences(tx, entries)
  const result: ProposeResult = { inserted: [], skipped: [] }
  for (const e of entries) {
    const [row] = await tx<{ id: number }[]>`
      insert into price.catalog_proposal (source, key_pattern, kind, proposal, rationale, confidence, proposed_by, status)
      values (${e.source}, ${e.key}, ${e.kind}, ${tx.json(e.proposal as never)}, ${e.rationale}, ${e.confidence}, ${proposedBy}, 'proposed')
      on conflict (source, key_pattern) where status in ('proposed', 'approved') do nothing
      returning id::int`
    if (row) {
      result.inserted.push({ id: row.id, source: e.source, key: e.key })
      continue
    }
    const [existing] = await tx<{ id: number }[]>`
      select id::int from price.catalog_proposal where source = ${e.source} and key_pattern = ${e.key} and status in ('proposed', 'approved')`
    result.skipped.push({ source: e.source, key: e.key, openProposal: existing!.id })
  }
  return result
}
