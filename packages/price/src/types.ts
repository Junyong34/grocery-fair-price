// 가격 화면이 읽는 모양. 정의는 schema.ts 한 곳에 있고(ADR 0004), 여기는 그 스키마에서 만든 타입을 이름 붙여 내보낸다.
// 필드 설명은 schema.ts의 주석에 있다(편집기에서 타입 위에 올리면 보인다).
import type { z } from "zod"

import type {
  forecastPointSchema,
  marketTypeQuoteSchema,
  marketTypeSchema,
  placeQuoteSchema,
  quoteBasisSchema,
  searchAliasSchema,
  searchIndexSchema,
  searchVarietySchema,
  shelfPriceSchema,
  trendPointSchema,
  varietyDetailSchema,
  varietySummarySchema,
  verdictBandSchema,
  verdictKindSchema,
  verdictSchema,
} from "./schema"

export type VerdictKind = z.infer<typeof verdictKindSchema>
export type Verdict = z.infer<typeof verdictSchema>
export type VerdictBand = z.infer<typeof verdictBandSchema>
export type QuoteBasis = z.infer<typeof quoteBasisSchema>
export type VarietySummary = z.infer<typeof varietySummarySchema>
export type MarketType = z.infer<typeof marketTypeSchema>
export type MarketTypeQuote = z.infer<typeof marketTypeQuoteSchema>
export type PlaceQuote = z.infer<typeof placeQuoteSchema>
export type TrendPoint = z.infer<typeof trendPointSchema>
export type ForecastPoint = z.infer<typeof forecastPointSchema>
export type ShelfPrice = z.infer<typeof shelfPriceSchema>
export type VarietyDetail = z.infer<typeof varietyDetailSchema>
export type SearchVariety = z.infer<typeof searchVarietySchema>
export type SearchAlias = z.infer<typeof searchAliasSchema>
export type SearchIndex = z.infer<typeof searchIndexSchema>
