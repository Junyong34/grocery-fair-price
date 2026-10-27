import "server-only"

import type { SearchIndex, VarietyDetail, VarietySummary } from "@workspace/price/types"

import { fixtureSource } from "./fixture-source"

// 가격 화면이 데이터를 읽는 유일한 입구. 화면 · 컴포넌트는 서버 컴포넌트에서 getPriceSource()를 부르고
// 결과를 props로 내린다. fixtures/를 직접 import하지 않는다(data-boundary.test.ts가 막는다).
//
// 다음 단계(Supabase): supabase-source.ts를 더하고 getPriceSource()만 바꾼다. 화면 코드는 고치지 않는다.
// - 파일 맨 위 import "server-only", 읽기 전용 롤 web_reader로 접속(WEB_DATABASE_URL, Supavisor 트랜잭션 모드 6543, prepare: false).
//   ingest-foundation/06, pipeline.md 3-0 "접속".
// - listVarieties  ← 뷰 price.current_judgment의 목록 열(variety_id, spec_id, as_of, today_price, usual, verdict, diff_pct)
//                    + variety · item · category · spec 이름, daily_quote national의 n · stale_days · meets_min_n. 가벼운 목록 쿼리 하나.
// - getVariety     ← current_judgment.payload 한 행(pipeline.md 4-1 모양)을 VarietyDetail로 옮긴다.
//                    장소 목록은 daily_quote market_type:* 와 KAMIS 시장별 관측값(judgment.md 0장 ①).
// - searchIndex    ← variety(status = 'active') · item · category · alias. 바뀌는 일이 드물어 길게 캐시한다.
// - featuredIds    ← 운영자가 정한 고정 목록. 지금은 상수, 검색 기록을 모으게 되면 바꾼다.
// 캐시: 메서드마다 "use cache" + cacheTag(품종별 태그)로 감싸고, 수집 · 재계산이 끝나면 갱신 신호로 태그를 버린다
// (ingest-foundation/06 "아직 열림").

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
  return fixtureSource
}
