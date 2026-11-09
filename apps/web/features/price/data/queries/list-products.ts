import type { Sql, TransactionSql } from "postgres"

import { PRODUCT_SUMMARY_KEYS, productSummarySchema } from "@workspace/price/schema"
import type { ProductSummary } from "@workspace/price/types"

/**
 * 현재 묶음의 참가격 상품 목록 행(catalog-scale/10). payload에서 목록 키(PRODUCT_SUMMARY_KEYS)만 골라 읽고 모양을 검사한다.
 * 조사를 멈춘 상품(discontinued)은 뺀다. 순서는 카테고리(category.sort) · 품목 · 상품 이름.
 * 모양이 어긋난 행은 빼고 로그를 남긴다(readVarieties와 같다).
 */
export async function readProducts(sql: Sql | TransactionSql): Promise<ProductSummary[]> {
  const rows = await sql<{ summary: unknown }[]>`
    select (
      select jsonb_object_agg(k.key, cp.payload -> k.key)
      from unnest(${PRODUCT_SUMMARY_KEYS as string[]}::text[]) as k (key)
      where cp.payload ? k.key
    ) as summary
    from price.current_product cp
    left join price.category c on c.name = cp.payload ->> 'category'
    where cp.status <> 'discontinued'
    order by c.sort nulls last, cp.payload ->> 'category', cp.payload ->> 'item', cp.payload ->> 'name'
  `
  return rows.flatMap(({ summary }) => {
    const parsed = productSummarySchema.safeParse(summary)
    if (parsed.success) return [parsed.data]
    const id = (summary as { id?: unknown } | null)?.id
    console.error(`[price] 상품 목록 행의 모양이 어긋나 뺀다: ${typeof id === "string" ? id : "(id 없음)"}`, parsed.error.issues)
    return []
  })
}
