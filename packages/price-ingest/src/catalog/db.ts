// 카탈로그의 원본(운영 DB)과 사본(snapshot.json)을 오간다 (catalog-scale/04, ADR 0005).
//   exportSnapshot: DB → 사본. ingest_writer로도 된다 (분류 표 읽기 권한)
//   importSnapshot: 사본 → DB. 분류 표·규칙 표는 운영자 표라 소유자(postgres) 접속으로만 쓴다.
//     로컬 DB 채우기와 운영 복구에 쓴다. 바뀐 분류 단위는 catalog_change에 남긴다.
//   readRules: 원천 키 규칙 (적재·백필이 읽는다)
import type { Sql, Tx } from "../load/db.ts"

import { diffSnapshots, rulesOfSnapshot, type CatalogChange, type Rule } from "./rules.ts"
import { BASE_UNITS, baseUnitLabel, UNIT_RULES, type BaseUnit, type CatalogSnapshot, type SpecDef, type VarietyDef } from "./types.ts"

type Db = Sql | Tx

export async function readRules(tx: Db): Promise<Rule[]> {
  return tx<Rule[]>`
    select r.source, r.key_pattern as key, r.action, v.slug as variety, s.slug as spec, u.rule_code as "unitRule", r.role, r.reason
      from price.catalog_key_rule r
      left join price.variety v on v.id = r.variety_id
      left join price.spec s on s.id = r.spec_id
      left join price.unit_rule u on u.id = r.unit_rule_id
     order by r.id`
}

export async function exportSnapshot(tx: Db): Promise<CatalogSnapshot> {
  const categories = await tx<{ slug: string; name: string }[]>`
    select slug, name from price.category order by sort nulls last, id`
  const items = await tx<{ slug: string; name: string; category: string }[]>`
    select i.slug, i.name, c.slug as category from price.item i join price.category c on c.id = i.category_id
     order by i.sort nulls last, i.id`
  const varieties = await tx<{ id: number; slug: string; name: string; item: string; base_unit: string; qty: string; status: string; spread: string | null }[]>`
    select v.id, v.slug, v.name, i.slug as item, v.base_unit, v.base_unit_qty::text as qty, v.status, v.price_spread as spread
      from price.variety v join price.item i on i.id = v.item_id
     order by v.sort nulls last, v.id`
  const specs = await tx<{ id: number; variety_id: number; slug: string; name: string }[]>`
    select id, variety_id, slug, name from price.spec order by variety_id, is_default desc, sort nulls last, id`
  const keys = await tx<{ spec_id: number; source: "kamis" | "ekape" | "chamga"; key: string }[]>`
    select spec_id, source, key_pattern as key from price.catalog_key_rule where action = 'map' order by id`
  const seasonal = await tx<{ variety_id: number; food: string }[]>`
    select variety_id, seasonal_food_id as food from price.variety_seasonal_map order by variety_id, seasonal_food_id`
  const exceptions = await tx<{ source: "kamis" | "ekape" | "chamga"; key: string; action: "ignore" | "hold"; reason: string }[]>`
    select source, key_pattern as key, action, reason from price.catalog_key_rule where action <> 'map' order by id`

  const keysOf = (specId: number, source: "kamis" | "ekape" | "chamga") => keys.filter((k) => k.spec_id === specId && k.source === source).map((k) => k.key)
  const specOf = (s: { id: number; slug: string; name: string }): SpecDef => {
    const out: { -readonly [K in keyof SpecDef]: SpecDef[K] } = { slug: s.slug, name: s.name }
    const kamis = keysOf(s.id, "kamis")
    const ekape = keysOf(s.id, "ekape")
    const chamga = keysOf(s.id, "chamga").map(Number)
    if (kamis.length) out.kamis = kamis
    if (ekape.length) out.ekape = ekape
    if (chamga.length) out.chamga = chamga
    return out
  }
  return {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
    items: items.map((i) => ({ slug: i.slug, name: i.name, category: i.category })),
    varieties: varieties.map((v) => {
      const out: { -readonly [K in keyof VarietyDef]: VarietyDef[K] } = {
        slug: v.slug,
        name: v.name,
        item: v.item,
        unit: baseUnitLabel(v.base_unit, Number(v.qty)) as BaseUnit,
      } as VarietyDef
      // 키 순서는 snapshot.json과 같게 둔다 (사본 diff가 순서로 흔들리지 않게)
      if (v.status === "hidden") out.status = "hidden"
      if (v.spread === "brand") out.spread = "brand"
      const foods = seasonal.filter((m) => m.variety_id === v.id).map((m) => m.food)
      if (foods.length) out.seasonal = foods
      out.specs = specs.filter((s) => s.variety_id === v.id).map(specOf)
      return out
    }),
    exceptions: exceptions.map((e) => ({ source: e.source, key: e.key, action: e.action, reason: e.reason })),
  }
}

export type ImportResult = { varieties: number; specs: number; rules: number; hidden: string[]; changes: CatalogChange[] }

// proposalId: 이 가져오기를 낳은 제안 (승인 적용·되돌리기, catalog-scale/08). 변경 기록에 함께 남긴다
export async function importSnapshot(tx: Tx, snapshot: CatalogSnapshot, actor: string, proposalId: number | null = null): Promise<ImportResult> {
  const before = await exportSnapshot(tx)
  const rules = rulesOfSnapshot(snapshot)

  await tx`
    insert into price.category as c (slug, name, sort)
    select r.slug, r.name, r.sort from jsonb_to_recordset(${tx.json(snapshot.categories.map((c, i) => ({ ...c, sort: i + 1 })))})
      as r (slug text, name text, sort smallint)
    on conflict (slug) do update set name = excluded.name, sort = excluded.sort
     where (c.name, c.sort) is distinct from (excluded.name, excluded.sort)`

  await tx`
    insert into price.item as i (category_id, slug, name, sort)
    select c.id, r.slug, r.name, r.sort
      from jsonb_to_recordset(${tx.json(snapshot.items.map((it, n) => ({ ...it, sort: n + 1 })))}) as r (slug text, name text, category text, sort smallint)
      join price.category c on c.slug = r.category
    on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, sort = excluded.sort
     where (i.category_id, i.name, i.sort) is distinct from (excluded.category_id, excluded.name, excluded.sort)`

  const varieties = snapshot.varieties.map((v, n) => ({
    slug: v.slug, name: v.name, item: v.item, ...BASE_UNITS[v.unit],
    status: v.status ?? "active", spread: v.spread ?? null, sort: n + 1,
  }))
  await tx`
    insert into price.variety as v (item_id, slug, name, base_unit, base_unit_qty, status, price_spread, sort)
    select i.id, r.slug, r.name, r.base_unit, r.base_unit_qty, r.status, r.spread, r.sort
      from jsonb_to_recordset(${tx.json(varieties)})
        as r (slug text, name text, item text, base_unit text, base_unit_qty numeric, status text, spread text, sort smallint)
      join price.item i on i.slug = r.item
    on conflict (slug) do update
      set item_id = excluded.item_id, name = excluded.name, base_unit = excluded.base_unit,
          base_unit_qty = excluded.base_unit_qty, status = excluded.status, price_spread = excluded.price_spread, sort = excluded.sort
     where (v.item_id, v.name, v.base_unit, v.base_unit_qty, v.status, v.price_spread, v.sort)
           is distinct from (excluded.item_id, excluded.name, excluded.base_unit, excluded.base_unit_qty, excluded.status, excluded.price_spread, excluded.sort)`

  // 사본에 없는 품종은 지우지 않고 숨긴다 (관측값·집계가 가리킬 수 있다)
  const hidden = await tx<{ slug: string }[]>`
    update price.variety set status = 'hidden'
     where status = 'active' and slug <> all(${snapshot.varieties.map((v) => v.slug)})
    returning slug`

  // 기본 규격을 바꿀 때 부분 unique(spec_one_default)에 걸리지 않게 먼저 내린다
  const specs = snapshot.varieties.flatMap((v) =>
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

  const seasonal = snapshot.varieties.flatMap((v) => (v.seasonal ?? []).map((id) => ({ variety: v.slug, food: id })))
  await tx`
    delete from price.variety_seasonal_map m using price.variety v
     where m.variety_id = v.id and v.slug = any(${snapshot.varieties.map((v) => v.slug)})
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

  // 규칙: 사본에 없는 원천 키는 지우고, 나머지는 사본대로 맞춘다
  const ruleRows = rules.map((r) => ({ ...r }))
  await tx`
    delete from price.catalog_key_rule k
     where (k.source, k.key_pattern) not in (
       select r.source, r.key from jsonb_to_recordset(${tx.json(ruleRows)}) as r (source text, key text))`
  await tx`
    insert into price.catalog_key_rule as k (source, key_pattern, action, variety_id, spec_id, unit_rule_id, role, reason)
    select r.source, r.key, r.action, v.id, s.id, u.id, r.role, r.reason
      from rows from (jsonb_to_recordset(${tx.json(ruleRows)})
        as (source text, key text, action text, variety text, spec text, "unitRule" text, role text, reason text)) with ordinality
        as r (source, key, action, variety, spec, "unitRule", role, reason, n)
      left join price.variety v on v.slug = r.variety
      left join price.spec s on s.variety_id = v.id and s.slug = r.spec
      left join lateral (select id from price.unit_rule where rule_code = r."unitRule" order by version desc limit 1) u on true
     order by r.n -- 새 규칙의 번호를 사본 순서대로 붙인다 (내보내기가 번호 순으로 읽는다)
    on conflict (source, key_pattern) do update
      set action = excluded.action, variety_id = excluded.variety_id, spec_id = excluded.spec_id,
          unit_rule_id = excluded.unit_rule_id, role = excluded.role, reason = excluded.reason
     where (k.action, k.variety_id, k.spec_id, k.unit_rule_id, k.role, k.reason)
           is distinct from (excluded.action, excluded.variety_id, excluded.spec_id, excluded.unit_rule_id, excluded.role, excluded.reason)`

  // 기본 규격이 없는 활성 품종 (pipeline 3-1 검사 질의)
  const noDefault = await tx<{ slug: string }[]>`
    select v.slug from price.variety v
     where v.status = 'active'
       and not exists (select 1 from price.spec s where s.variety_id = v.id and s.is_default)`
  if (noDefault.length > 0) throw new Error(`기본 규격이 없는 활성 품종: ${noDefault.map((r) => r.slug).join(", ")}`)

  const changes = diffSnapshots(before, await exportSnapshot(tx))
  if (changes.length > 0) {
    await tx`
      insert into price.catalog_change (actor, target, target_key, action, before, after, proposal_id)
      select ${actor}, c.target, c."targetKey", c.action, c.before, c.after, ${proposalId}
        from jsonb_to_recordset(${tx.json(changes as never)}) as c (target text, "targetKey" text, action text, before jsonb, after jsonb)`
  }
  return { varieties: snapshot.varieties.length, specs: specs.length, rules: rules.length, hidden: hidden.map((r) => r.slug), changes }
}
