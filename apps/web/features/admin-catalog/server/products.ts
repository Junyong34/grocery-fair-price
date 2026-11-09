import "server-only"

import { PRICE_COPY } from "@workspace/price/copy"

import { summarizeProducts, type ProductRow, type ProductSummary } from "../lib/product-view"
import { readerDb } from "./reader-db"

// 상품 목록 어드민의 읽기 (catalog-scale/10). 참가격 상품 전부와 품목·품종 연결, 지금 공개된 상품 payload를 읽기 전용으로 읽는다.
// 카테고리·품목은 상품 payload(product-db.ts)와 같은 규칙이다: 상품의 품목이 있으면 그것, 없으면 출처 분류 대응표(05)의 참가격 AL 소분류.

export type ProductCatalog = { rows: ProductRow[]; summary: ProductSummary; categories: string[] }

type Row = {
  good_id: string
  name: string
  status: ProductRow["status"]
  item: string | null
  item_set: boolean
  category: string | null
  map_status: "mapped" | "ignored" | "pending" | null
  variety: string | null
  variety_name: string | null
  page: { status: "active" | "stale" | "discontinued"; price: number; perUnit: { unit: string; price: number } | null; surveyedOn: string } | null
}

export async function getProductCatalog(): Promise<ProductCatalog> {
  return readerDb().begin("read only", async (sql) => {
    const rows = await sql<Row[]>`
      select si.key_parts->>'goodId' as good_id, p.name, p.status,
             coalesce(i.name, m.class_name) as item, p.item_id is not null as item_set,
             coalesce(ic.name, mc.name) as category,
             pm.status as map_status, v.slug as variety, v.name as variety_name,
             case when cp.payload is null then null else jsonb_build_object(
               'status', cp.status, 'price', (cp.payload->>'price')::int, 'perUnit', cp.payload->'perUnit', 'surveyedOn', cp.payload->>'surveyedOn')
             end as page
        from price.product p
        join price.product_source_key k on k.product_id = p.id and k.valid_to is null
        join price.source_item si on si.id = k.source_item_id
        left join lateral (
          select x.al_code from price.product_attr_history x where x.product_id = p.id order by x.valid_from desc limit 1
        ) h on true
        left join price.item i on i.id = p.item_id
        left join price.category ic on ic.id = i.category_id
        left join price.category_source_map m on m.source = 'chamga' and m.source_class = h.al_code
        left join price.category mc on mc.id = m.category_id
        left join price.product_variety_map pm on pm.product_id = p.id and pm.valid_to is null
        left join price.variety v on v.id = pm.variety_id
        left join price.current_product cp on cp.product_id = p.id
        left join price.category c on c.name = coalesce(ic.name, mc.name)
       order by c.sort nulls last, coalesce(i.name, m.class_name), p.name`
    const categories = await sql<{ name: string }[]>`select name from price.category order by sort nulls last, name`

    const out: ProductRow[] = rows.map((r) => ({
      goodId: r.good_id,
      name: r.name,
      status: r.status,
      category: r.category ?? "기타",
      item: r.item ?? "기타",
      itemSet: r.item_set,
      link:
        r.map_status === "mapped" && r.variety
          ? { kind: "mapped", variety: r.variety, varietyName: r.variety_name ?? r.variety }
          : { kind: r.map_status === "ignored" ? "ignored" : "pending" },
      page: r.page && {
        status: r.page.status,
        price: r.page.price,
        perUnit: r.page.perUnit ? PRICE_COPY.product.perUnit(r.page.perUnit.unit, r.page.perUnit.price) : null,
        surveyedOn: r.page.surveyedOn,
      },
    }))
    return { rows: out, summary: summarizeProducts(out), categories: categories.map((c) => c.name) }
  })
}
