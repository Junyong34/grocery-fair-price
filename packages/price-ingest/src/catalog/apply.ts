// 카탈로그를 DB에 넣는다 (ingest-foundation/08).
//   분류 표(applyClasses): 운영자 표라 소유자(postgres) 접속으로만 쓴다
//   매핑(applyMappings): ingest_writer가 쓴다. pending만 바꾸고, 이미 다르게 정한 매핑은 고치지 않고 알린다.
//     적재도 파일마다 부른다(onLoad, 09): 처음 본 키를 카탈로그대로 바로 잇는다
import type { Tx } from "../load/db.ts"

import { CHAMGA_UNDECIDED, UNIT_RULES, chamgaTarget, ekapeTarget, kamisTarget, type CatalogTarget } from "./match.ts"
import { BASE_UNITS, CATEGORIES, ITEMS, VARIETIES } from "./varieties.ts"

export type ClassesResult = { varieties: number; specs: number; hidden: string[] }

export async function applyClasses(tx: Tx): Promise<ClassesResult> {
  await tx`
    insert into price.category as c (slug, name, sort)
    select r.slug, r.name, r.sort from jsonb_to_recordset(${tx.json(CATEGORIES.map((c, i) => ({ ...c, sort: i + 1 })))})
      as r (slug text, name text, sort smallint)
    on conflict (slug) do update set name = excluded.name, sort = excluded.sort
     where (c.name, c.sort) is distinct from (excluded.name, excluded.sort)`

  await tx`
    insert into price.item as i (category_id, slug, name)
    select c.id, r.slug, r.name from jsonb_to_recordset(${tx.json(ITEMS)}) as r (slug text, name text, category text)
      join price.category c on c.slug = r.category
    on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name
     where (i.category_id, i.name) is distinct from (excluded.category_id, excluded.name)`

  const varieties = VARIETIES.map((v) => ({ slug: v.slug, name: v.name, item: v.item, ...BASE_UNITS[v.unit] }))
  await tx`
    insert into price.variety as v (item_id, slug, name, base_unit, base_unit_qty, status)
    select i.id, r.slug, r.name, r.base_unit, r.base_unit_qty, 'active'
      from jsonb_to_recordset(${tx.json(varieties)}) as r (slug text, name text, item text, base_unit text, base_unit_qty numeric)
      join price.item i on i.slug = r.item
    on conflict (slug) do update
      set item_id = excluded.item_id, name = excluded.name, base_unit = excluded.base_unit,
          base_unit_qty = excluded.base_unit_qty, status = 'active'
     where (v.item_id, v.name, v.base_unit, v.base_unit_qty, v.status)
           is distinct from (excluded.item_id, excluded.name, excluded.base_unit, excluded.base_unit_qty, 'active')`

  // 카탈로그에서 빠진 품종은 지우지 않고 숨긴다 (관측값·집계가 가리킬 수 있다)
  const hidden = await tx<{ slug: string }[]>`
    update price.variety set status = 'hidden'
     where status = 'active' and slug <> all(${VARIETIES.map((v) => v.slug)})
    returning slug`

  // 기본 규격을 바꿀 때 부분 unique(spec_one_default)에 걸리지 않게 먼저 내린다
  const specs = VARIETIES.flatMap((v) =>
    v.specs.map((s, i) => ({ variety: v.slug, slug: s.slug, name: s.name, is_default: i === 0, sort: i + 1 })),
  )
  await tx`
    update price.spec s set is_default = false
      from price.variety v, jsonb_to_recordset(${tx.json(specs.filter((s) => s.is_default))}) as d (variety text, slug text)
     where s.variety_id = v.id and v.slug = d.variety and s.is_default and s.slug <> d.slug`
  await tx`
    insert into price.spec as s (variety_id, slug, name, is_default, sort)
    select v.id, r.slug, r.name, r.is_default, r.sort
      from jsonb_to_recordset(${tx.json(specs)}) as r (variety text, slug text, name text, is_default boolean, sort smallint)
      join price.variety v on v.slug = r.variety
    on conflict (variety_id, slug) do update set name = excluded.name, is_default = excluded.is_default, sort = excluded.sort
     where (s.name, s.is_default, s.sort) is distinct from (excluded.name, excluded.is_default, excluded.sort)`

  const seasonal = VARIETIES.flatMap((v) => (v.seasonal ?? []).map((id) => ({ variety: v.slug, food: id })))
  await tx`
    delete from price.variety_seasonal_map m using price.variety v
     where m.variety_id = v.id and v.slug = any(${VARIETIES.map((v) => v.slug)})
       and (v.slug, m.seasonal_food_id) not in (
         select r.variety, r.food from jsonb_to_recordset(${tx.json(seasonal)}) as r (variety text, food text))`
  await tx`
    insert into price.variety_seasonal_map (variety_id, seasonal_food_id)
    select v.id, r.food from jsonb_to_recordset(${tx.json(seasonal)}) as r (variety text, food text)
      join price.variety v on v.slug = r.variety
    on conflict do nothing`

  await tx`
    insert into price.unit_rule (rule_code, version, price_tier, kind, params, note)
    select r.rule_code, 1, 'retail', 'same_unit', jsonb_build_object('from_unit', r.from_unit), '같은 단위 계열 안에서 나눈다'
      from jsonb_to_recordset(${tx.json(UNIT_RULES)}) as r (rule_code text, from_unit text)
     where not exists (select 1 from price.unit_rule u where u.rule_code = r.rule_code)`

  // 기본 규격이 없는 활성 품종 (pipeline 3-1 검사 질의)
  const noDefault = await tx<{ slug: string }[]>`
    select v.slug from price.variety v
     where v.status = 'active'
       and not exists (select 1 from price.spec s where s.variety_id = v.id and s.is_default)`
  if (noDefault.length > 0) throw new Error(`기본 규격이 없는 활성 품종: ${noDefault.map((r) => r.slug).join(", ")}`)

  return { varieties: VARIETIES.length, specs: specs.length, hidden: hidden.map((r) => r.slug) }
}

export type MappingConflict = { key: string; current: string; catalog: string }

export type MappingsResult = {
  mapped: number // pending → mapped (원천 키·상품)
  ignored: number // 참가격 pending → ignored
  pending: number // 남은 pending (카탈로그에 없는 키)
  conflicts: MappingConflict[] // 이미 다르게 정해져 있어 고치지 않은 것
}

type OpenMap = {
  key: string
  map_id: number | null
  status: string | null
  variety: string | null
  spec: string | null
  role: string | null
}

// 충돌은 품종·규격·대표 여부로만 본다. 단위 규칙은 이름이 달라도 같은 환산일 수 있다
const describe = (m: Pick<OpenMap, "status" | "variety" | "spec" | "role">) =>
  m.status === "mapped" ? `${m.variety}/${m.spec} ${m.role}` : String(m.status)
const describeTarget = (t: CatalogTarget) => `${t.variety}/${t.spec} ${t.role}`

type MapRow = { id: number; variety: string; spec: string; unit_rule: string; role: string }

// onLoad(적재 중): 카탈로그에 없는 참가격 상품을 ignored로 두지 않고 pending으로 남겨 운영자가 보게 하고,
// 품종이 DB에 아직 없는 대상은 건너뛴다. 아니면(사람이 부른 명령) ignored로 두고, 품종이 없으면 멈춘다.
export async function applyMappings(tx: Tx, { onLoad = false }: { onLoad?: boolean } = {}): Promise<MappingsResult> {
  const conflicts: MappingConflict[] = []

  const specRows = await tx<{ key: string }[]>`
    select v.slug || '/' || s.slug as key from price.spec s join price.variety v on v.id = s.variety_id where v.status = 'active'`
  const ruleRows = await tx<{ rule_code: string }[]>`select distinct rule_code from price.unit_rule`
  const specs = new Set(specRows.map((r) => r.key))
  const rules = new Set(ruleRows.map((r) => r.rule_code))
  let missing = 0
  const usable = (t: CatalogTarget) => {
    const ok = specs.has(`${t.variety}/${t.spec}`) && rules.has(t.unitRule)
    if (!ok) missing += 1
    return ok
  }

  // ── KAMIS·축평원: source_code_map의 열린 행 (valid_to null)
  const sourceRows = await tx<(OpenMap & { source: string; key_parts: Record<string, string> })[]>`
    select si.source, si.source_key as key, si.key_parts, m.id as map_id, m.status, m.role,
           v.slug as variety, s.slug as spec
      from price.source_item si
      left join price.source_code_map m on m.source_item_id = si.id and m.valid_to is null
      left join price.variety v on v.id = m.variety_id
      left join price.spec s on s.id = m.spec_id
     where si.source in ('kamis', 'ekape')`
  const toMap: MapRow[] = []
  let pending = 0
  for (const row of sourceRows) {
    const target = row.source === "kamis" ? kamisTarget(row.key_parts) : ekapeTarget(row.key_parts)
    if (target === undefined) {
      if (row.status === "pending") pending += 1
      continue
    }
    if (row.map_id !== null && row.status === "pending") {
      if (usable(target)) toMap.push({ id: row.map_id, variety: target.variety, spec: target.spec, unit_rule: target.unitRule, role: target.role })
      else pending += 1
    } else if (describe(row) !== describeTarget(target)) {
      conflicts.push({ key: row.key, current: describe(row), catalog: describeTarget(target) })
    }
  }

  // ── 참가격: 상품의 열린 product_variety_map
  const productRows = await tx<(OpenMap & { product_id: number; valid_from: string; good_id: string })[]>`
    select p.id as product_id, si.key_parts->>'goodId' as good_id, si.source_key as key,
           pm.valid_from::text, pm.status, 'primary' as role, null::int as map_id,
           v.slug as variety, s.slug as spec
      from price.product p
      join price.product_source_key k on k.product_id = p.id and k.valid_to is null
      join price.source_item si on si.id = k.source_item_id
      left join price.product_variety_map pm on pm.product_id = p.id and pm.valid_to is null
      left join price.variety v on v.id = pm.variety_id
      left join price.spec s on s.id = pm.spec_id
     where p.status <> 'merged'`
  const productMap: { product_id: number; valid_from: string; variety: string; spec: string; unit_rule: string }[] = []
  const productIgnore: { product_id: number; valid_from: string }[] = []
  for (const row of productRows) {
    const goodId = Number(row.good_id)
    const target = chamgaTarget(goodId)
    if (row.status !== "pending") {
      if (target !== undefined && describe(row) !== describeTarget(target)) {
        conflicts.push({ key: row.key, current: describe(row), catalog: describeTarget(target) })
      }
      continue
    }
    if (target !== undefined) {
      if (usable(target)) productMap.push({ product_id: row.product_id, valid_from: row.valid_from, variety: target.variety, spec: target.spec, unit_rule: target.unitRule })
      else pending += 1
    } else if (onLoad || CHAMGA_UNDECIDED.has(goodId)) {
      pending += 1
    } else {
      productIgnore.push({ product_id: row.product_id, valid_from: row.valid_from })
    }
  }
  if (missing > 0 && !onLoad) {
    throw new Error("카탈로그의 품종·규격·단위 규칙이 DB에 없다. 분류 표를 먼저 넣는다 (catalog --classes)")
  }

  await tx`
    update price.source_code_map m
       set status = 'mapped', variety_id = v.id, spec_id = s.id, unit_rule_id = u.id, role = r.role,
           note = 'catalog', updated_at = now()
      from jsonb_to_recordset(${tx.json(toMap)}) as r (id int, variety text, spec text, unit_rule text, role text)
      join price.variety v on v.slug = r.variety
      join price.spec s on s.variety_id = v.id and s.slug = r.spec
      join lateral (select id from price.unit_rule where rule_code = r.unit_rule order by version desc limit 1) u on true
     where m.id = r.id`
  await tx`
    update price.product_variety_map m
       set status = 'mapped', variety_id = v.id, spec_id = s.id, unit_rule_id = u.id, origin = 'operator'
      from jsonb_to_recordset(${tx.json(productMap)}) as r (product_id int, valid_from date, variety text, spec text, unit_rule text)
      join price.variety v on v.slug = r.variety
      join price.spec s on s.variety_id = v.id and s.slug = r.spec
      join lateral (select id from price.unit_rule where rule_code = r.unit_rule order by version desc limit 1) u on true
     where m.product_id = r.product_id and m.valid_from = r.valid_from`
  await tx`
    update price.product_variety_map m set status = 'ignored', origin = 'operator'
      from jsonb_to_recordset(${tx.json(productIgnore)}) as r (product_id int, valid_from date)
     where m.product_id = r.product_id and m.valid_from = r.valid_from`

  return { mapped: toMap.length + productMap.length, ignored: productIgnore.length, pending, conflicts }
}
