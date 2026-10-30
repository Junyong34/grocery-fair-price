import "server-only"

import { cacheLife } from "next/cache"
import { cache } from "react"

import { searchIndexSchema, varietyDetailSchema, varietySummarySchema } from "@workspace/price/schema"
import type { SearchIndex, VarietyDetail, VarietySummary } from "@workspace/price/types"

import { FEATURED_IDS } from "./featured"
import type { PriceSource } from "./price-source"
import { getVarietyRow } from "./queries/get-variety"
import { listVarietyRows } from "./queries/list-varieties"
import { getSearchExtrasRow } from "./queries/search-index"

// 운영 DB(price.current_judgment) 구현. 캐시 정책은 메서드마다 여기서 정한다(.scratch/price-db-read/spec.md 2장).
// payload는 화면 타입 그대로라(ADR 0004) 옮겨 담지 않고 zod로 모양만 검사한다. DB 오류는 그대로 던져 error.tsx가 받는다.

// 시세 · 판정은 하루 1~2번 바뀐다. 모양이 어긋난 행(배치보다 먼저 배포된 웹이 옛 payload를 읽는 경우)은 빼고 로그를 남긴다.
async function listVarieties(): Promise<readonly VarietySummary[]> {
  "use cache"
  cacheLife("hours")
  const rows = await listVarietyRows()
  return rows.flatMap(({ summary }) => {
    const parsed = varietySummarySchema.safeParse(summary)
    if (parsed.success) return [parsed.data]
    console.error(`[price] 판정 목록 행의 모양이 어긋나 뺀다: ${idOf(summary)}`, parsed.error.issues)
    return []
  })
}

// 품종은 목록에서 뽑는다. 판정이 없는 품종이 검색에 나와 상세가 404가 되는 일을 막는다(spec 4장).
async function searchIndex(): Promise<SearchIndex> {
  "use cache"
  cacheLife("days")
  const [varieties, extras] = await Promise.all([listVarieties(), getSearchExtrasRow()])
  return searchIndexSchema.parse({
    varieties: varieties.map(({ id, name, item, category }) => ({ id, name, item, category })),
    aliases: extras.aliases,
    categories: extras.categories,
  })
}

// 상세는 캐시하지 않고 요청마다 읽는다. generateMetadata와 본문이 같은 요청에서 부르므로 cache()로 한 번만 읽는다.
const getVariety = cache(async (id: string): Promise<VarietyDetail | null> => {
  const row = await getVarietyRow(id)
  return row ? varietyDetailSchema.parse(row.payload) : null
})

function idOf(payload: unknown): string {
  const id = (payload as { id?: unknown } | null)?.id
  return typeof id === "string" ? id : "(id 없음)"
}

export const dbSource: PriceSource = {
  listVarieties,
  getVariety,
  searchIndex,
  async featuredIds() {
    return FEATURED_IDS
  },
}
