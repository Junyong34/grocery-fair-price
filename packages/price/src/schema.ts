// 가격 화면이 읽는 모양의 유일한 정의(ADR 0004). 판정 payload를 읽을 때 이 스키마로 검사하고, types.ts의 타입은 여기서 z.infer로 만든다.
// 필드를 더하거나 옮길 때는 이 파일만 고친다. 목록이 payload에서 읽는 키도 varietySummarySchema의 키(VARIETY_SUMMARY_KEYS)다.
// 날짜는 모두 서울 기준 "YYYY-MM-DD" 문자열, 가격은 기준 단위 하나의 원 단위 정수다. 알 수 없는 키는 버린다(zod 객체의 기본).
import { z } from "zod"

/** 판정 종류. none은 평소가가 없어 판정을 못 낸 "판정 전". */
export const verdictKindSchema = z.enum(["cheap", "normal", "pricey", "none"])

/** 판정: 종류와 평소가 대비 차이(%, 반올림한 정수). 판정 전이면 pct는 null. */
export const verdictSchema = z.object({
  kind: verdictKindSchema,
  pct: z.number().nullable(),
})

/**
 * 판정 구간. 평소가 대비 차이(%)가 lower보다 낮으면 싸요, upper보다 높으면 비싸요.
 * 품종마다 다르다(judgment.md 2장).
 */
export const verdictBandSchema = z.object({
  lower: z.number(),
  upper: z.number(),
})

/** 시세의 출처와 범위(근거 한 줄의 재료). */
export const quoteBasisSchema = z.object({
  /** "KAMIS" */
  source: z.string(),
  /** "전국 조사 시장" */
  scope: z.string(),
})

/** 목록 행 하나(P1 메인 · P2 검색 · P4 담은 품종). 판정 payload에서 이 키만 읽는다. */
export const varietySummarySchema = z.object({
  /** 가격 품종 slug. URL에 쓴다(variety.slug). */
  id: z.string(),
  name: z.string(),
  /** 품목 이름 */
  item: z.string(),
  /** 카테고리 이름 */
  category: z.string(),
  /** 규격 이름("상품", "냉장"). 규격 구분이 없으면 null */
  spec: z.string().nullable(),
  /** 기준 단위 표시("1포기", "100g") */
  baseUnit: z.string(),
  /** 시세: 조사일에 조사한 곳들의 중간값 */
  price: z.number(),
  /** 평소가. 아직 계산하지 못했으면 null(판정 전) */
  usual: z.number().nullable(),
  verdict: verdictSchema,
  /** 시세의 조사일 */
  surveyedOn: z.string(),
  /** 시세를 낸 조사 시장 수 */
  sampleSize: z.number(),
  /** 갱신 지연: 최근 조사가 오지 않아 조사일이 오래됐다 */
  stale: z.boolean(),
  /** 최소 표본 수를 넘었나. 기준이 정해지기 전이면 null */
  meetsMinN: z.boolean().nullable(),
  /** 시세의 출처와 범위. 목록 아래 근거 한 줄도 행마다 이것을 모아 쓴다 */
  basis: quoteBasisSchema,
})

/** 목록이 판정 payload에서 읽는 키. 상세 전용 필드는 여기에 없으므로 목록 응답에 들어가지 않는다. */
export const VARIETY_SUMMARY_KEYS: readonly string[] = varietySummarySchema.keyof().options

/** 업태(시세에서는 KAMIS 시장 유형). */
export const marketTypeSchema = z.enum(["large_retail", "traditional"])

/** 업태별 시세 중간값(daily_quote의 market_type:* 범위). */
export const marketTypeQuoteSchema = z.object({
  type: marketTypeSchema,
  median: z.number(),
  /** 조사 시장 수 */
  n: z.number(),
})

/**
 * 장소 하나의 시세(P3 "어디서 얼마에 팔까"). 판정을 매기지 않는다(judgment.md 0장 ①).
 * 대형마트는 KAMIS가 이름을 기호로 가려 주므로 같은 기호(체인)를 한 행으로 묶고, 전통시장은 시장 하나가 한 행이다.
 */
export const placeQuoteSchema = z.object({
  type: marketTypeSchema,
  /** "대형마트 C", "신정시장" */
  name: z.string(),
  /** 시도 이름. 체인처럼 여러 지역에 걸치면 null */
  region: z.string().nullable(),
  /** 대표 가격: 조사 시장이 하나면 그 값, 여럿이면 중간값 */
  price: z.number(),
  /** 이 행에 묶인 조사 시장별 가격 */
  samples: z.array(z.number()).readonly(),
})

/** 가격 추이의 하루. 그날 시세가 없으면 price가 null, 평소가가 없으면 usual이 null. */
export const trendPointSchema = z.object({
  date: z.string(),
  price: z.number().nullable(),
  usual: z.number().nullable(),
})

/** 평년 흐름으로 본 예상의 하루: 가운데 값과 넓어지는 범위. */
export const forecastPointSchema = z.object({
  date: z.string(),
  price: z.number(),
  low: z.number(),
  high: z.number(),
})

/** 판매처 한 곳의 판매가(참가격). */
export const shelfPriceSchema = z.object({
  seller: z.string(),
  price: z.number(),
  /** 행사 표시("행사 ~10/29"). 행사가 아니면 null */
  promo: z.string().nullable(),
})

/** 품종 상세 하나(P3). judgment_snapshot.payload 한 행 그대로다. */
export const varietyDetailSchema = varietySummarySchema.extend({
  band: verdictBandSchema,
  /** brand: 같은 품종 안에서도 품종 · 브랜드마다 값이 크게 달라 판정 아래 안내 한 줄을 붙인다(쌀 등). 없으면 붙이지 않는다 */
  priceSpread: z.literal("brand").optional(),
  /** 조사일의 시세 범위 */
  range: z.object({ min: z.number(), max: z.number(), n: z.number() }),
  /** 업태별 중간값 */
  marketTypes: z.array(marketTypeQuoteSchema).readonly(),
  /** 장소별 시세. 화면이 업태별로 나누고 싼 순으로 늘어놓는다 */
  places: z.array(placeQuoteSchema).readonly(),
  /** 최근 6개월 시세와 평소가, 날짜 오름차순 */
  trend: z.array(trendPointSchema).readonly(),
  /** 평년 흐름으로 본 예상. 평소가가 없으면 빈 배열 */
  forecast: z.array(forecastPointSchema).readonly(),
  /** 판매처별 판매가. 판매가가 없는 품종은 null */
  shelf: z.object({ surveyedOn: z.string(), prices: z.array(shelfPriceSchema).readonly() }).nullable(),
})

/** 검색이 찾는 품종 하나. */
export const searchVarietySchema = z.object({
  id: z.string(),
  name: z.string(),
  item: z.string(),
  category: z.string(),
})

/** 별칭: 사용자가 쓰는 다른 이름이 품종 하나나 품목 하나를 가리킨다. */
export const searchAliasSchema = z.union([
  z.object({ text: z.string(), varietyId: z.string() }),
  z.object({ text: z.string(), item: z.string() }),
])

/** 검색 재료. 서버가 한 번 내려 주고 브라우저에서 거른다. */
export const searchIndexSchema = z.object({
  varieties: z.array(searchVarietySchema).readonly(),
  aliases: z.array(searchAliasSchema).readonly(),
  /** 카테고리 이름, 보여 줄 순서대로 */
  categories: z.array(z.string()).readonly(),
})
