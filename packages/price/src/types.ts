// 가격 화면이 읽는 모양. 지금은 apps/web의 하드코딩 데이터가, 다음 단계에서는 Supabase가 채운다.
// 열은 grocery-price/docs/30-data/pipeline.md 4-1(판정 payload)과 뷰 current_judgment의 목록 열에 맞췄다.
// 날짜는 모두 서울 기준 "YYYY-MM-DD" 문자열, 가격은 기준 단위 하나의 원 단위 정수다.

/** 판정 종류. none은 평소가가 없어 판정을 못 낸 "판정 전". */
export type VerdictKind = "cheap" | "normal" | "pricey" | "none"

/** 판정: 종류와 평소가 대비 차이(%, 반올림한 정수). 판정 전이면 pct는 null. */
export type Verdict = { kind: VerdictKind; pct: number | null }

/**
 * 판정 구간. 평소가 대비 차이(%)가 lower보다 낮으면 싸요, upper보다 높으면 비싸요.
 * 품종마다 다르다(judgment.md 2장). 계산식이 정해지기 전까지는 ±10%.
 */
export type VerdictBand = { lower: number; upper: number }

/** 목록 행 하나(P1 메인 · P2 검색 · P4 담은 품종). current_judgment 한 행에 해당한다. */
export interface VarietySummary {
  /** 가격 품종 slug. URL에 쓴다(variety.slug). */
  id: string
  name: string
  /** 품목 이름 */
  item: string
  /** 카테고리 이름 */
  category: string
  /** 규격 이름("상품", "냉장"). 규격 구분이 없으면 null */
  spec: string | null
  /** 기준 단위 표시("1포기", "100g") */
  baseUnit: string
  /** 시세: 조사일에 조사한 곳들의 중간값 */
  price: number
  /** 평소가. 아직 계산하지 못했으면 null(판정 전) */
  usual: number | null
  verdict: Verdict
  /** 시세의 조사일 */
  surveyedOn: string
  /** 시세를 낸 조사 시장 수 */
  sampleSize: number
  /** 갱신 지연: 최근 조사가 오지 않아 조사일이 오래됐다 */
  stale: boolean
  /** 최소 표본 수를 넘었나. 기준이 정해지기 전이면 null */
  meetsMinN: boolean | null
}

/** 업태(시세에서는 KAMIS 시장 유형). */
export type MarketType = "large_retail" | "traditional"

/** 업태별 시세 중간값(daily_quote의 market_type:* 범위). */
export interface MarketTypeQuote {
  type: MarketType
  median: number
  /** 조사 시장 수 */
  n: number
}

/**
 * 장소 하나의 시세(P3 "어디서 얼마에 팔까"). 판정을 매기지 않는다(judgment.md 0장 ①).
 * 대형마트는 KAMIS가 이름을 기호로 가려 주므로 같은 기호(체인)를 한 행으로 묶고, 전통시장은 시장 하나가 한 행이다.
 */
export interface PlaceQuote {
  type: MarketType
  /** "대형마트 C", "신정시장" */
  name: string
  /** 시도 이름. 체인처럼 여러 지역에 걸치면 null */
  region: string | null
  /** 대표 가격: 조사 시장이 하나면 그 값, 여럿이면 중간값 */
  price: number
  /** 이 행에 묶인 조사 시장별 가격 */
  samples: readonly number[]
}

/** 가격 추이의 하루. 그날 시세가 없으면 price가 null, 평소가가 없으면 usual이 null. */
export interface TrendPoint {
  date: string
  price: number | null
  usual: number | null
}

/** 평년 흐름으로 본 예상의 하루: 가운데 값과 넓어지는 범위. */
export interface ForecastPoint {
  date: string
  price: number
  low: number
  high: number
}

/** 판매처 한 곳의 판매가(참가격). */
export interface ShelfPrice {
  seller: string
  price: number
  /** 행사 표시("행사 ~10/29"). 행사가 아니면 null */
  promo: string | null
}

/** 화면 맨 아래 근거 한 줄의 재료. */
export interface QuoteBasis {
  /** "KAMIS" */
  source: string
  /** "전국 조사 시장" */
  scope: string
}

/** 품종 상세 하나(P3). judgment_snapshot.payload 한 행에 해당한다. */
export interface VarietyDetail extends VarietySummary {
  band: VerdictBand
  /** brand: 같은 품종 안에서도 품종 · 브랜드마다 값이 크게 달라 판정 아래 안내 한 줄을 붙인다(쌀 등). 없으면 붙이지 않는다 */
  priceSpread?: "brand"
  /** 조사일의 시세 범위 */
  range: { min: number; max: number; n: number }
  /** 업태별 중간값 */
  marketTypes: readonly MarketTypeQuote[]
  /** 장소별 시세. 화면이 업태별로 나누고 싼 순으로 늘어놓는다 */
  places: readonly PlaceQuote[]
  /** 최근 6개월 시세와 평소가, 날짜 오름차순 */
  trend: readonly TrendPoint[]
  /** 평년 흐름으로 본 예상. 평소가가 없으면 빈 배열 */
  forecast: readonly ForecastPoint[]
  /** 판매처별 판매가. 판매가가 없는 품종은 null */
  shelf: { surveyedOn: string; prices: readonly ShelfPrice[] } | null
  basis: QuoteBasis
}

/** 검색이 찾는 품종 하나. */
export interface SearchVariety {
  id: string
  name: string
  item: string
  category: string
}

/** 별칭: 사용자가 쓰는 다른 이름이 품종 하나나 품목 하나를 가리킨다. */
export type SearchAlias =
  | { text: string; varietyId: string }
  | { text: string; item: string }

/** 검색 재료. 서버가 한 번 내려 주고 브라우저에서 거른다. */
export interface SearchIndex {
  varieties: readonly SearchVariety[]
  aliases: readonly SearchAlias[]
  /** 카테고리 이름, 보여 줄 순서대로 */
  categories: readonly string[]
}
