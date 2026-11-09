import type { Sql, TransactionSql } from "postgres"

import { productDetailSchema } from "@workspace/price/schema"
import type { ProductDetail } from "@workspace/price/types"

/** 참가격 상품 번호(goodId)로 현재 묶음의 상품 payload 한 행(catalog-scale/09·10). 없으면 null, 모양이 어긋나면 던진다. */
export async function readProduct(sql: Sql | TransactionSql, id: string): Promise<ProductDetail | null> {
  const [row] = await sql<{ payload: unknown }[]>`
    select payload from price.current_product where payload ->> 'id' = ${id} limit 1
  `
  return row ? productDetailSchema.parse(row.payload) : null
}
