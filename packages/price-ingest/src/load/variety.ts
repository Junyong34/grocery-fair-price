// 관측값에 품종·규격과 기준 단위 가격을 붙인다 (pipeline 3-1, ingest-foundation/09).
// 매핑은 관측일에 유효한 mapped 행: KAMIS·축평원은 원천 키의 source_code_map, 참가격은 상품의 product_variety_map.
// 같은 SQL을 적재의 임시 표와 이미 쌓인 관측값(다시 매핑)에 쓴다. 바뀐 행만 고친다.
//
// 기준 단위 가격 = 원천 가격 ÷ (원천 수량을 기준 단위로 바꾼 값) × base_unit_qty. 원천 수량·단위는
//   KAMIS: qty_raw·unit_raw (20·kg, 10·개)
//   축평원: qty_raw와 unit_raw의 '원/' 뒤 (원/100g → 100·g). unit_mismatch 표시가 있으면 비운다
//   참가격: 관측일의 상품 속성 total_qty·total_unit (UT 코드)
// 단위 계열이 기준 단위와 다르거나(손·단·망, 무게 대 개수) 단위 규칙이 same_unit이 아니면 비운다.
// 단위 표는 adapt/units.ts와 같다.
import { UNIT_TABLE } from "../adapt/units.ts"

import type { Tx } from "./db.ts"
import type { DbSource } from "./types.ts"

// table: 관측값 모양의 표. where: 그 표(별칭 o)에서 고칠 행을 고르는 조건 (없으면 전부)
async function mapRows(tx: Tx, table: string, where: string, params: string[]): Promise<number> {
  const result = await tx.unsafe(
    `with units as (
       select * from jsonb_to_recordset($1::text::jsonb) as u (unit text, family text, factor numeric, name text)
     ), calc as (
       select o.source_item_id, o.obs_date, o.place_id, l.variety_id, l.spec_id,
              case when l.variety_id is null or ur.kind <> 'same_unit' or 'unit_mismatch' = any(coalesce(o.flags, '{}'))
                     or not (q.qty > 0) then null
                   when v.base_unit = 'g' and u.family = 'mass'
                     or v.base_unit = 'ml' and u.family = 'volume'
                     then round(o.price_raw / (q.qty * u.factor) * v.base_unit_qty, 2)
                   when v.base_unit = 'ea' and u.family = 'count' and u.name = 'ea'
                     then round(o.price_raw / q.qty * v.base_unit_qty, 2)
              end as price_per_base,
              l.unit_rule_id
         from ${table} o
         left join lateral (
           select m.variety_id, m.spec_id, m.unit_rule_id from price.source_code_map m
            where o.product_id is null and m.source_item_id = o.source_item_id and m.status = 'mapped'
              and daterange(m.valid_from, m.valid_to) @> o.obs_date
           union all
           select pm.variety_id, pm.spec_id, pm.unit_rule_id from price.product_variety_map pm
            where pm.product_id = o.product_id and pm.status = 'mapped'
              and daterange(pm.valid_from, pm.valid_to) @> o.obs_date
         ) l on true
         left join price.variety v on v.id = l.variety_id
         left join price.unit_rule ur on ur.id = l.unit_rule_id
         left join lateral (
           select h.total_qty, h.total_unit from price.product_attr_history h
            where h.product_id = o.product_id and daterange(h.valid_from, h.valid_to) @> o.obs_date
         ) h on o.product_id is not null
         cross join lateral (
           select case when o.product_id is not null then h.total_qty else o.qty_raw end as qty,
                  case when o.product_id is not null then h.total_unit
                       when o.unit_raw like '원/%' then regexp_replace(o.unit_raw, '^원/[0-9]*', '')
                       else o.unit_raw end as unit
         ) q
         left join units u on u.unit = q.unit
        ${where}
     )
     update ${table} o
        set variety_id = c.variety_id, spec_id = c.spec_id, price_per_base = c.price_per_base,
            unit_rule_id = case when c.price_per_base is null then null else c.unit_rule_id end
       from calc c
      where (o.source_item_id, o.obs_date, o.place_id) = (c.source_item_id, c.obs_date, c.place_id)
        and (o.variety_id, o.spec_id, o.price_per_base, o.unit_rule_id)
            is distinct from (c.variety_id, c.spec_id, c.price_per_base,
                              case when c.price_per_base is null then null else c.unit_rule_id end)`,
    [JSON.stringify(UNIT_TABLE), ...params],
  )
  return result.count
}

// 적재: 병합 전에 임시 표의 행에 붙인다
export function mapStagedObservations(tx: Tx, table: string): Promise<number> {
  return mapRows(tx, table, "", [])
}

// 다시 매핑: 이 출처의 관측값을 지금 매핑대로 고친다. 값이 아니라 분류가 바뀐 것이라 정정 기록은 남기지 않는다.
// 지워진 관측값(보존 기간 밖)은 원본에서 다시 적재해야 한다 (pipeline 3-3).
export function remapObservations(tx: Tx, source: DbSource): Promise<number> {
  return mapRows(tx, "price.observation", "where o.source_item_id in (select id from price.source_item where source = $2)", [source])
}
