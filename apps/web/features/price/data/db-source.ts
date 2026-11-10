import "server-only"

import { cacheLife } from "next/cache"

import type { Category, ProductDetail, ProductSummary, SearchIndex, VarietyDetail, VarietySummary } from "@workspace/price/types"

import { db } from "./db"
import { FEATURED_IDS } from "./featured"
import type { PriceSource } from "./price-source"
import { readProduct } from "./queries/get-product"
import { readVariety } from "./queries/get-variety"
import { readCategories } from "./queries/list-categories"
import { readProducts } from "./queries/list-products"
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

// 카테고리(slug · 이름)는 드물게 바뀐다.
async function listCategories(): Promise<readonly Category[]> {
  "use cache"
  cacheLife("days")
  return readCategories(db())
}

// 상세도 목록과 같은 수명으로 캐시한다(2026-11-05). 요청마다 읽으면 P3 본문 전체가 동적이라 셸이 비고, 콜드 스타트 때 1~3초가 걸렸다.
// 캐시하면 P3가 빌드 때 미리 그려진다. 대신 배치가 바꾼 값은 최대 hours만큼 늦게 보인다(목록과 같다). generateMetadata와 본문이 같은 키로 부른다.
async function getVariety(id: string): Promise<VarietyDetail | null> {
  "use cache"
  cacheLife("hours")
  return readVariety(db(), id)
}

// 상품(price.current_product)도 판정과 같은 묶음이라 같은 수명으로 캐시한다. 참가격은 2주마다 조사하지만 묶음은 날마다 바뀐다.
async function listProducts(): Promise<readonly ProductSummary[]> {
  "use cache"
  cacheLife("hours")
  return readProducts(db())
}

async function getProduct(id: string): Promise<ProductDetail | null> {
  "use cache"
  cacheLife("hours")
  return readProduct(db(), id)
}

export const dbSource: PriceSource = {
  listCategories,
  listProducts,
  getProduct,
  listVarieties,
  getVariety,
  searchIndex,
  async featuredIds() {
    return FEATURED_IDS
  },
}
