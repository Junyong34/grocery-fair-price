import "server-only"

import type { SearchIndex, VarietyDetail, VarietySummary } from "@workspace/price/types"

import { dbSource } from "./db-source"

// 가격 화면이 데이터를 읽는 유일한 입구. 화면 · 컴포넌트는 서버 컴포넌트에서 getPriceSource()를 부르고
// 결과를 props로 내린다(.scratch/price-db-read/spec.md 3장).
// - db.ts           postgres 클라이언트 하나(web_reader, server-only)
// - queries/        메서드마다 SQL 하나와 행 타입
// - db-source.ts    PriceSource 구현: 캐시 정책 + queries/ 호출 + zod 파싱(@workspace/price/schema)
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
}

/** 지금 쓰는 데이터 구현. */
export function getPriceSource(): PriceSource {
  return dbSource
}
