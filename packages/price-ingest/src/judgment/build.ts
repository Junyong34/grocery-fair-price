// 판정 한 행 만들기 (ingest-foundation/11, pipeline.md 4-3). DB를 모르는 순수 함수다. DB 읽기·쓰기는 cli.ts.
// payload는 화면이 읽는 VarietyDetail 그대로다 (pipeline.md 4-1). 숫자는 다시 계산하지 않고 모아서 옮긴다:
//   판정 차이: 평소가 행의 components.deviation (최근 3 조사일 편차의 중앙값, judgment.md 2장). 그날 하루 시세로 다시 내지 않는다
//   판정 구간: 같은 행의 components.band (비율) → 정수 %
//   평소가가 없거나, 시세 조사일의 평소가가 아니면 판정 전 (judgment.md 3장)
//   갱신 지연: 같은 값이 이어진 날 수(stale_days, 축평원만 센다, 6-3)가 기준 이상이거나,
//     조사일이 모든 품종 중 가장 최근 조사일보다 기준 이상 앞이다 (철이 지나 조사가 멈춘 품종)
//   판정 전이면 추이의 평소가도 비운다. 판정 구간은 {0, 0}이고 화면은 쓰지 않는다
//   예상(forecast)은 아직 계산하지 않는다. 빈 배열이면 화면이 그리지 않는다
import { daysBetween, monthDay } from "@workspace/price/format"
import type { MarketType, PlaceQuote, ShelfPrice, VarietyDetail } from "@workspace/price/types"
import { verdictOfPct } from "@workspace/price/verdict"

import { KAMIS_SGG_NAMES } from "../load/kamis-market-codes.ts"

export type JudgmentInput = {
  variety: { slug: string; name: string; item: string; category: string; baseUnit: string; spec: string | null; spread?: "brand" }
  /** 모든 품종 중 가장 최근 소매 national 조사일 */
  latestDay: string
  /** 대표 규격의 가장 최근 소매 national 시세 (daily_quote) */
  quote: {
    day: string
    price: number
    n: number
    min: number | null
    max: number | null
    meetsMinN: boolean | null
    staleDays: number | null
    sources: readonly string[]
  }
  /** 대표 규격의 가장 최근 평소가 행 (usual_price). band는 비율(−0.12 = −12%) */
  usual: { asOf: string; value: number; deviation: number | null; band: { low: number; high: number } | null } | null
  /** 그날의 market_type:* 시세 */
  marketTypes: readonly { type: string; median: number; n: number }[]
  /** 그날의 KAMIS 시장 표본 */
  samples: readonly { market: string; marketType: string; sgg: string; price: number }[]
  /** 최근 6개월, 날짜 오름차순 */
  trend: readonly { day: string; price: number | null; usual: number | null }[]
  /** 가장 최근 참가격 조사일의 판매처별 판매가. 없으면 null */
  shelf: {
    day: string
    sellers: readonly { seller: string; prices: readonly { price: number; promo: boolean; promoTo: string | null }[] }[]
  } | null
}

export type JudgmentRow = {
  asOf: string
  todayPrice: number
  usual: number | null
  /** DB check 이름. 판정 전은 null */
  verdict: "cheap" | "normal" | "expensive" | null
  diffPct: number | null
}

const MARKET_TYPES: readonly MarketType[] = ["large_retail", "traditional"]
const DB_VERDICT = { cheap: "cheap", normal: "normal", pricey: "expensive", none: null } as const

const won = (v: number) => Math.round(v)

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

const isMarketType = (type: string): type is MarketType => (MARKET_TYPES as readonly string[]).includes(type)

// KAMIS는 대형마트 이름을 "C-유통" 같은 기호로 가린다. 같은 기호(체인)를 한 행으로 묶는다
function places(samples: JudgmentInput["samples"]): PlaceQuote[] {
  const groups = new Map<string, { type: MarketType; name: string; sggs: Set<string>; prices: number[] }>()
  for (const s of samples) {
    if (!isMarketType(s.marketType)) continue
    const chain = s.marketType === "large_retail"
    const name = chain ? `대형마트 ${s.market.replace(/-유통$/, "")}` : `${s.market}시장`
    const key = chain ? `${s.marketType}|${name}` : `${s.marketType}|${name}|${s.sgg}`
    const g = groups.get(key) ?? { type: s.marketType, name, sggs: new Set(), prices: [] }
    g.sggs.add(s.sgg)
    g.prices.push(won(s.price))
    groups.set(key, g)
  }
  return [...groups.values()]
    .map((g) => ({
      type: g.type,
      name: g.name,
      region: g.sggs.size === 1 ? (KAMIS_SGG_NAMES.get([...g.sggs][0]!) ?? null) : null,
      price: won(median(g.prices)),
      samples: g.prices.sort((a, b) => a - b),
    }))
    .sort((a, b) => MARKET_TYPES.indexOf(a.type) - MARKET_TYPES.indexOf(b.type) || a.name.localeCompare(b.name, "ko"))
}

// 판매처마다 행사 아닌 값의 중간값. 행사 값뿐이면 행사가의 중간값과 가장 늦게 끝나는 날
function shelf(input: JudgmentInput["shelf"]): VarietyDetail["shelf"] {
  if (!input) return null
  const prices: ShelfPrice[] = []
  for (const { seller, prices: all } of input.sellers) {
    const regular = all.filter((p) => !p.promo)
    if (regular.length > 0) {
      prices.push({ seller, price: won(median(regular.map((p) => p.price))), promo: null })
    } else if (all.length > 0) {
      const to = all.map((p) => p.promoTo).filter((d): d is string => d !== null).sort().at(-1)
      prices.push({ seller, price: won(median(all.map((p) => p.price))), promo: to ? `행사 ~${monthDay(to)}` : "행사" })
    }
  }
  if (prices.length === 0) return null
  return { surveyedOn: input.day, prices: prices.sort((a, b) => a.price - b.price) }
}

export function buildJudgment(input: JudgmentInput, params: { staleDays: number }): { row: JudgmentRow; payload: VarietyDetail } {
  const { variety, quote } = input
  const u = input.usual
  const judged = u !== null && u.asOf === quote.day && u.deviation !== null && u.band !== null ? u : null
  const band = judged ? { lower: Math.round(judged.band!.low * 100), upper: Math.round(judged.band!.high * 100) } : { lower: 0, upper: 0 }
  const verdict = judged ? verdictOfPct(Math.round(judged.deviation! * 100) || 0, band) : { kind: "none" as const, pct: null }
  const price = won(quote.price)
  const usual = judged ? won(judged.value) : null
  const stale =
    (quote.staleDays !== null && quote.staleDays >= params.staleDays) || daysBetween(quote.day, input.latestDay) >= params.staleDays
  const national = quote.sources.includes("kamis")

  const payload: VarietyDetail = {
    id: variety.slug,
    name: variety.name,
    item: variety.item,
    category: variety.category,
    spec: variety.spec,
    baseUnit: variety.baseUnit,
    price,
    usual,
    verdict,
    surveyedOn: quote.day,
    sampleSize: quote.n,
    stale,
    meetsMinN: quote.meetsMinN,
    band,
    ...(variety.spread ? { priceSpread: variety.spread } : {}),
    range: { min: won(quote.min ?? quote.price), max: won(quote.max ?? quote.price), n: quote.n },
    marketTypes: input.marketTypes
      .filter((m): m is typeof m & { type: MarketType } => isMarketType(m.type))
      .map((m) => ({ type: m.type, median: won(m.median), n: m.n }))
      .sort((a, b) => MARKET_TYPES.indexOf(a.type) - MARKET_TYPES.indexOf(b.type)),
    places: places(input.samples),
    // 판정 전이면 평소가 선도 그리지 않는다 (price-screens spec "판정 전")
    trend: input.trend.map((t) => ({
      date: t.day,
      price: t.price === null ? null : won(t.price),
      usual: judged && t.usual !== null ? won(t.usual) : null,
    })),
    forecast: [],
    shelf: shelf(input.shelf),
    basis: national ? { source: "KAMIS", scope: "전국 조사 시장" } : { source: "축평원", scope: "전국 평균" },
  }
  const row: JudgmentRow = { asOf: quote.day, todayPrice: price, usual, verdict: DB_VERDICT[verdict.kind], diffPct: verdict.pct }
  return { row, payload }
}
