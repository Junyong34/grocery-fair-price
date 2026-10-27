// 장소별 시세(P3 "어디서 얼마에 팔까")의 순수 계산. 판정을 매기지 않는다(judgment.md 0장 ①).

import type { MarketType, PlaceQuote } from "./types"

/** 업태별로 나누고 각각 싼 순으로. */
export function placesByType(places: readonly PlaceQuote[]): Record<MarketType, PlaceQuote[]> {
  const cheapFirst = [...places].sort((a, b) => a.price - b.price)
  return {
    large_retail: cheapFirst.filter((place) => place.type === "large_retail"),
    traditional: cheapFirst.filter((place) => place.type === "traditional"),
  }
}

/** 여러 조사 시장이 모두 같은 값인 체인("대형마트 C 9곳 · 전국 같은 값"). */
export function sameEverywhere(place: PlaceQuote): boolean {
  return place.samples.length > 1 && place.samples.every((price) => price === place.samples[0])
}
