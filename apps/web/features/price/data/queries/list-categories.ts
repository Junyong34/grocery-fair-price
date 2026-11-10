import type { Sql, TransactionSql } from "postgres"

import { categorySchema } from "@workspace/price/schema"
import type { Category } from "@workspace/price/types"

/** 카테고리 목록(slug · 이름), 보여 줄 순서(category.sort)대로. 상품 카테고리 페이지의 주소와 제목에 쓴다. */
export async function readCategories(sql: Sql | TransactionSql): Promise<Category[]> {
  const rows = await sql`select slug, name from price.category order by sort nulls last, name`
  return categorySchema.array().parse(rows)
}
