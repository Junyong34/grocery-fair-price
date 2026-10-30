import type { Sql, TransactionSql } from "postgres"

import { VARIETY_SUMMARY_KEYS, varietySummarySchema } from "@workspace/price/schema"
import type { VarietySummary } from "@workspace/price/types"

/**
 * 현재 판정 묶음의 목록 행. payload에서 목록 행의 키(VARIETY_SUMMARY_KEYS)만 골라 읽고 모양을 검사한다.
 * 순서는 카테고리(category.sort) · 품종 이름. 모양이 어긋난 행(배치보다 먼저 배포된 웹이 옛 payload를 읽는 경우)은 빼고 로그를 남긴다.
 */
export async function readVarieties(sql: Sql | TransactionSql): Promise<VarietySummary[]> {
  const rows = await sql<{ summary: unknown }[]>`
    select (
      select jsonb_object_agg(k.key, cj.payload -> k.key)
      from unnest(${VARIETY_SUMMARY_KEYS as string[]}::text[]) as k (key)
      where cj.payload ? k.key
    ) as summary
    from price.current_judgment cj
    join price.variety v on v.id = cj.variety_id
    join price.item i on i.id = v.item_id
    join price.category c on c.id = i.category_id
    order by c.sort nulls last, c.name, cj.payload ->> 'name'
  `
  return rows.flatMap(({ summary }) => {
    const parsed = varietySummarySchema.safeParse(summary)
    if (parsed.success) return [parsed.data]
    console.error(`[price] 판정 목록 행의 모양이 어긋나 뺀다: ${idOf(summary)}`, parsed.error.issues)
    return []
  })
}

function idOf(summary: unknown): string {
  const id = (summary as { id?: unknown } | null)?.id
  return typeof id === "string" ? id : "(id 없음)"
}
