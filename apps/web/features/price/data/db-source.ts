import "server-only"

import { cacheLife } from "next/cache"
import { cache } from "react"

import type { SearchIndex, VarietyDetail, VarietySummary } from "@workspace/price/types"

import { db } from "./db"
import { FEATURED_IDS } from "./featured"
import type { PriceSource } from "./price-source"
import { readVariety } from "./queries/get-variety"
import { readVarieties } from "./queries/list-varieties"
import { readSearchExtras } from "./queries/search-index"

// 운영 DB(price.current_judgment) 구현. 여기서는 캐시 정책만 정한다(.scratch/price-db-read/spec.md 2장).
// SQL · 모양 검사 · 어긋난 행 처리는 queries/가 맡고, 로컬 DB 테스트(queries/*.db.test.ts)가 그 interface를 확인한다.
// DB 오류는 그대로 던져 error.tsx가 받는다.

// 시세 · 판정은 하루 1~2번 바뀐다.
async function listVarieties(): Promise<readonly VarietySummary[]> {
  "use cache"
  cacheLife("hours")
  return readVarieties(db())
}

// 품종은 목록에서 뽑는다. 판정이 없는 품종이 검색에 나와 상세가 404가 되는 일을 막는다(spec 4장).
// 중첩된 "use cache"는 바깥의 cacheLife가 이기므로, 바깥을 목록과 같은 hours로 둬야 품종이 며칠씩 묵지 않는다.
async function searchIndex(): Promise<SearchIndex> {
  "use cache"
  cacheLife("hours")
  const [varieties, extras] = await Promise.all([listVarieties(), searchExtras()])
  return { varieties: varieties.map(({ id, name, item, category }) => ({ id, name, item, category })), ...extras }
}

// 별칭 · 카테고리는 드물게 바뀐다.
async function searchExtras() {
  "use cache"
  cacheLife("days")
  return readSearchExtras(db())
}

// 상세는 캐시하지 않고 요청마다 읽는다. generateMetadata와 본문이 같은 요청에서 부르므로 cache()로 한 번만 읽는다.
const getVariety = cache((id: string): Promise<VarietyDetail | null> => readVariety(db(), id))

export const dbSource: PriceSource = {
  listVarieties,
  getVariety,
  searchIndex,
  async featuredIds() {
    return FEATURED_IDS
  },
}
