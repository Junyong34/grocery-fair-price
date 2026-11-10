import "server-only"

import type { Category, ProductDetail, ProductSummary, SearchIndex, VarietyDetail, VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { dbSource } from "./db-source"

// 가격 화면이 데이터를 읽는 유일한 입구. 화면 · 컴포넌트는 서버 컴포넌트에서 getPriceSource()를 부르고
// 결과를 props로 내린다(.scratch/price-db-read/spec.md 3장).
// - db.ts           postgres 클라이언트 하나(web_reader, server-only)
// - queries/        판정 읽기 module: 메서드마다 파일 하나, sql을 받아 SQL · 모양 검사(@workspace/price/schema)까지 하고
//                   검사된 값을 돌려준다. 로컬 DB 테스트 queries/*.db.test.ts(pnpm db:test)
// - db-source.ts    PriceSource 구현: 캐시 정책만, queries/에 db()를 넘긴다
// - featured.ts     자주 사는 품종 상수
// data/ 밖에서는 db · db-source · queries/를 import하지 않는다(data-boundary.test.ts가 막는다).

export interface PriceSource {
  /** 메인 · 검색 · 담은 품종 목록 */
  listVarieties(): Promise<readonly VarietySummary[]>
  /** 품종 상세. 없는 품종이면 null */
  getVariety(id: string): Promise<VarietyDetail | null>
  /** 검색 재료: 품종 · 품목 · 별칭 · 카테고리 */
  searchIndex(): Promise<SearchIndex>
  /** 자주 사는 품종(운영자가 정한 목록) */
  featuredIds(): Promise<readonly string[]>
  /** 카테고리 목록(slug · 이름), 보여 줄 순서대로. 상품 카테고리 페이지의 주소에 쓴다 */
  listCategories(): Promise<readonly Category[]>
  /** 참가격 상품 목록(검색의 상품 묶음 · 상품 카테고리 페이지). 판정이 없다 (catalog-scale/10) */
  listProducts(): Promise<readonly ProductSummary[]>
  /** 상품 상세. id는 참가격 상품 번호(goodId). 없는 상품이면 null */
  getProduct(id: string): Promise<ProductDetail | null>
}

/** 지금 쓰는 데이터 구현. */
export function getPriceSource(): PriceSource {
  return dbSource
}

/**
 * 시세 화면이 있는 품종이면 그 주소, 없으면 null. 제철 품종 상세가 같은 id의 시세로 이을 때 쓴다.
 * 제철 화면은 가격 DB 없이도 떠야 하므로 DB 오류는 "링크 없음"으로 삼킨다.
 */
export async function priceVarietyPath(id: string): Promise<string | null> {
  try {
    const { varieties } = await getPriceSource().searchIndex()
    return varieties.some((variety) => variety.id === id) ? routes.price.variety(id) : null
  } catch (error) {
    console.error("시세 품종 목록을 읽지 못해 시세 링크를 뺍니다", error)
    return null
  }
}
