// 품종 상세. 배추는 와이어프레임 값(detail-baechu.ts), 나머지 품종은 목록 행에서 그럴듯한 값을 만든다.
// 품종 id로 시드를 정해 늘 같은 값이 나온다. 다음 단계에서 judgment_snapshot.payload로 바뀐다.

import { addDays } from "@workspace/price/format"
import type { ForecastPoint, PlaceQuote, TrendPoint, VarietyDetail, VarietySummary } from "@workspace/price/types"
import { DEFAULT_BAND } from "@workspace/price/verdict"

import { BAECHU_DETAIL } from "./detail-baechu"

export function detailOf(summary: VarietySummary): VarietyDetail {
  if (summary.id === "napa-cabbage") return { ...summary, ...BAECHU_DETAIL }
  const random = seeded(summary.id)
  const places = placesOf(summary, random)
  const all = places.flatMap((place) => place.samples)
  const ofType = (type: PlaceQuote["type"]) => places.filter((place) => place.type === type).flatMap((place) => place.samples)
  const trend = trendOf(summary, random)
  return {
    ...summary,
    band: DEFAULT_BAND,
    range: { min: Math.min(...all), max: Math.max(...all), n: all.length },
    marketTypes: (["large_retail", "traditional"] as const)
      .map((type) => ({ type, median: median(ofType(type)), n: ofType(type).length }))
      .filter((quote) => quote.n > 0),
    places,
    trend,
    forecast: forecastOf(summary, trend),
    shelf: SHELF[summary.id] ?? null,
    basis: { source: "KAMIS", scope: "전국 조사 시장" },
  }
}

// 판매가가 있는 품종은 배추와 삼겹살뿐이다(판매처 연결 전, spec 7장).
const SHELF: Record<string, VarietyDetail["shelf"]> = {
  "pork-belly": {
    surveyedOn: "2026-10-16",
    prices: [
      { seller: "홈플러스", price: 2690, promo: "행사 ~10/30" },
      { seller: "하나로마트", price: 2890, promo: null },
      { seller: "이마트", price: 2980, promo: null },
      { seller: "롯데마트", price: 3180, promo: null },
    ],
  },
}

const MARKETS: readonly (readonly [string, string])[] = [
  ["신정시장", "울산"], ["역전시장", "대전"], ["양동시장", "광주"], ["남부시장", "전주"], ["육거리시장", "청주"],
  ["복조리시장", "서울"], ["경동시장", "서울"], ["중앙시장", "춘천"], ["현대시장", "인천"], ["상남시장", "창원"],
  ["역전시장", "순천"], ["부전시장", "부산"], ["지동시장", "수원"], ["죽도시장", "포항"], ["칠성시장", "대구"],
  ["동문시장", "제주"], ["망원시장", "서울"], ["서문시장", "대구"],
]
const CHAINS = ["대형마트 A", "대형마트 B", "대형마트 C", "대형마트 E"]

/** 조사 시장별 시세: 시세 둘레에 퍼뜨리고, 대형마트는 조금 싸게 전통시장은 조금 비싸게. */
function placesOf(summary: VarietySummary, random: () => number): PlaceQuote[] {
  const n = summary.sampleSize
  const nMart = Math.max(1, Math.round(n * 0.6))
  const factors = Array.from({ length: n }, (_, i) => 1 + 0.36 * ((i + 0.5) / n - 0.5) + 0.04 * (random() - 0.5)).sort((a, b) => a - b)
  // 고르게 섞어 나눈다: 대형마트 nMart곳, 나머지는 전통시장
  const isMart = (i: number) => Math.floor(((i + 1) * nMart) / n) > Math.floor((i * nMart) / n)
  const mart = factors.filter((_, i) => isMart(i)).map((f) => roundPrice(summary.price * f * 0.96))
  const market = factors.filter((_, i) => !isMart(i)).map((f) => roundPrice(summary.price * f * 1.05))

  const chains: PlaceQuote[] = []
  const size = Math.ceil(mart.length / CHAINS.length)
  CHAINS.forEach((name, c) => {
    let samples = mart.slice(c * size, (c + 1) * size)
    if (!samples.length) return
    // 짝수 번째 체인은 전국이 같은 값
    if (c % 2 === 0 && samples.length > 2) samples = samples.map(() => median(samples))
    chains.push({ type: "large_retail", name, region: null, price: median(samples), samples })
  })
  const markets = market.map((price, i): PlaceQuote => {
    const [name, region] = MARKETS[i % MARKETS.length]!
    return { type: "traditional", name, region, price, samples: [price] }
  })
  return [...chains, ...markets]
}

/** 최근 6개월 추이. 평소가가 없는 품종은 이력이 짧다(최근 45일). 마지막 날은 시세 그대로. */
function trendOf(summary: VarietySummary, random: () => number): TrendPoint[] {
  const phase = random() * 40
  const wave = (t: number) => 1 + 0.06 * Math.sin((t + phase) / 45)
  const usualAt = (t: number) => (summary.usual == null ? null : (summary.usual * wave(t)) / wave(0))
  const base = summary.usual ?? summary.price
  const swing = (t: number) => base * (wave(t) / wave(0)) * (1 + 0.09 * Math.sin(t / 13 + phase) + 0.03 * Math.sin(t / 3.1 + phase))
  const from = summary.usual == null ? -45 : -182
  const points: TrendPoint[] = []
  for (let t = -182; t <= 0; t++) {
    // 끝 20일에 걸쳐 오늘 시세로 이어 붙인다
    const blend = Math.max(0, (t + 20) / 20)
    const price = swing(t) + (summary.price - swing(0)) * blend
    const usual = usualAt(t)
    points.push(
      t === 0
        ? { date: summary.surveyedOn, price: summary.price, usual: summary.usual }
        : {
            date: addDays(summary.surveyedOn, t),
            price: t < from ? null : roundPrice(price),
            usual: usual == null ? null : roundPrice(usual),
          }
    )
  }
  return points
}

/** 평년 흐름으로 본 예상: 오늘 시세에서 4주 뒤 평소가 쪽으로 옮겨 가고, 범위가 열흘에 걸쳐 벌어진다. */
function forecastOf(summary: VarietySummary, trend: readonly TrendPoint[]): ForecastPoint[] {
  const usual = trend.at(-1)?.usual
  if (usual == null) return []
  const days = 28
  return Array.from({ length: days }, (_, i) => {
    const t = i + 1
    const mid = summary.price + (usual - summary.price) * (t / days)
    const spread = summary.price * 0.11 * Math.min(1, t / 10)
    return {
      date: addDays(summary.surveyedOn, t),
      price: roundPrice(mid),
      low: roundPrice(mid - spread),
      high: roundPrice(mid + spread),
    }
  })
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const k = sorted.length >> 1
  return sorted.length % 2 ? sorted[k]! : roundPrice((sorted[k - 1]! + sorted[k]!) / 2)
}

/** 천 원이 넘으면 10원 단위, 그보다 싸면 원 단위 */
const roundPrice = (v: number) => (v >= 1000 ? Math.round(v / 10) * 10 : Math.round(v))

/** 문자열 시드 난수(0..1). */
function seeded(key: string): () => number {
  let state = [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}
