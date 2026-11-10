// 상품 payload의 재료를 DB에서 읽는다 (catalog-scale/09). 만들기는 product.ts(순수 함수), 쓰기는 cli.ts(writeJudgment).
// 카테고리·품목은 상품 분류 뷰(price.product_classification)를 읽는다. 분류가 없는 상품은 화면에 내지 않는다.
import type { Tx } from "../load/db.ts"
import { buildProduct, type ProductInput, type SummaryRow } from "./product.ts"

// 추이에 쓰는 기간. 참가격은 2주마다 조사하니 12 조사일 남짓이다
const TREND_DAYS = 182

type ProductRow = Omit<ProductInput, "rows" | "sellers"> & { id: number }

export type BuiltProduct = { productId: number; payload: NonNullable<ReturnType<typeof buildProduct>> }

export async function readProducts(tx: Tx): Promise<BuiltProduct[]> {
  const [latest] = await tx<{ day: string | null }[]>`
    select max(obs_date)::text as day from price.product_daily_summary where scope_key = 'national'`
  const latestDay = latest?.day
  if (!latestDay) return []

  // 분류는 상품 분류 뷰(product_classification)가 정한다. 분류가 없는 상품(placed_by 'none')은 payload를 만들지 않는다
  const products = await tx<ProductRow[]>`
    select p.id, si.key_parts->>'goodId' as "goodId", p.name, p.status,
           pc.item_name as item, pc.category_name as category,
           pc.total_qty::float8 as "totalQty", pc.total_unit as "totalUnit", v.slug as "varietyId"
      from price.product p
      join price.product_classification pc on pc.product_id = p.id and pc.placed_by <> 'none'
      join price.product_source_key k on k.product_id = p.id and k.valid_to is null
      join price.source_item si on si.id = k.source_item_id
      left join price.product_variety_map pm on pm.product_id = p.id and pm.valid_to is null and pm.status = 'mapped'
      left join price.variety v on v.id = pm.variety_id
     order by p.id`
  // 전국 범위는 상품마다 마지막 전국 조사일부터 추이 기간만큼, 업태·판매처 범위는 그 마지막 조사일만.
  // 기간을 묶음의 최근 조사일로 재면 조사에서 빠진(stale) 상품의 행이 모두 잘려 payload가 없어진다
  const rows = await tx<(SummaryRow & { product_id: number })[]>`
    with last as (
      select product_id, max(obs_date) as day from price.product_daily_summary where scope_key = 'national' group by product_id
    )
    select s.product_id, s.scope_key as scope, s.obs_date::text as date, s.median::float8 as median, s.min, s.max,
           s.n_stores as stores, s.promo_n as promo
      from price.product_daily_summary s
      join last l on l.product_id = s.product_id
     where s.median is not null and s.min is not null and s.max is not null
       and ((s.scope_key = 'national' and s.obs_date > l.day - ${TREND_DAYS}::int)
         or ((s.scope_key like 'channel:%' or s.scope_key like 'seller:%') and s.obs_date = l.day))`
  const sellerRows = await tx<{ id: number; name: string; channel: string }[]>`select id, name, channel from price.seller`
  const sellers = new Map(sellerRows.map((s) => [s.id, { name: s.name, channel: s.channel }]))

  const rowsOf = new Map<number, SummaryRow[]>()
  for (const { product_id, ...r } of rows) rowsOf.set(product_id, [...(rowsOf.get(product_id) ?? []), r])

  return products.flatMap((p) => {
    const { id, ...rest } = p
    const payload = buildProduct({ ...rest, rows: rowsOf.get(id) ?? [], sellers }, latestDay)
    return payload ? [{ productId: id, payload }] : []
  })
}
