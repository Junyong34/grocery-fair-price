import type { Sql, TransactionSql } from "postgres"

import { varietyDetailSchema } from "@workspace/price/schema"
import type { VarietyDetail } from "@workspace/price/types"

/** 품종 id(variety.slug)로 현재 판정 payload 한 행(ADR 0004). 없으면 null, 모양이 어긋나면 던진다. */
export async function readVariety(sql: Sql | TransactionSql, id: string): Promise<VarietyDetail | null> {
  const [row] = await sql<{ payload: unknown }[]>`
    select payload from price.current_judgment where payload ->> 'id' = ${id} limit 1
  `
  return row ? varietyDetailSchema.parse(row.payload) : null
}
