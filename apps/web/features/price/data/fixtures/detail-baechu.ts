// 배추 상세. 와이어프레임 값: 시세 4,500 · 평소가 4,150, 범위 3,900~5,200(45곳), 대형마트 3,900 · 전통시장 4,940,
// 장소는 10/26 배추 KAMIS 실측 표본, 판매가는 참가격 10/10 조사 예시. 추이 곡선은 와이어프레임 그림의 식을 옮겼다.

import { addDays } from "@workspace/price/format"
import type { ForecastPoint, PlaceQuote, TrendPoint, VarietyDetail, VarietySummary } from "@workspace/price/types"

import { SURVEYED_ON } from "./varieties"

const USUAL = 4150
const NOW = 4500

const smooth = (x: number) => x * x * (3 - 2 * x)
const round10 = (v: number) => Math.round(v / 10) * 10

// 평년 같은 시기의 평소가 흐름: 9월 중순에 오르고 오늘 즈음 4,150원을 완만히 지난다. t는 조사일로부터 날 수.
const rawUsual = (t: number) => 3920 + 950 * Math.exp(-(((t + 38) / 32) ** 2)) + 260 * Math.cos((t + 120) / 58)
const usualAt = (t: number) => (rawUsual(t) * USUAL) / rawUsual(0)

// 최근 60일 시세 기준점 (8/24 3,800 → 9/18 6,100 → 10월 4,300~4,600)
const KEYS: readonly (readonly [number, number])[] = [
  [-60, 3800], [-52, 4200], [-45, 4800], [-38, 5700], [-35, 6100], [-31, 5800], [-26, 5200],
  [-20, 4600], [-16, 4350], [-12, 4300], [-8, 4450], [-5, 4600], [-2, 4520], [0, NOW],
]
function keyAt(t: number): number {
  for (let i = 1; i < KEYS.length; i++) {
    const [t0, v0] = KEYS[i - 1]!
    const [t1, v1] = KEYS[i]!
    if (t <= t1) return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0))
  }
  return NOW
}
const older = (t: number) =>
  usualAt(t) *
  (1 +
    0.05 * Math.sin(t / 9) +
    0.025 * Math.sin(t / 3.3) -
    0.2 * Math.exp(-(((t + 185) / 9) ** 2)) + // 4월 말 쌌던 때
    0.24 * Math.exp(-(((t + 118) / 6) ** 2)) + // 6월 말 장마 때 비쌌던 때
    0.16 * Math.exp(-(((t + 300) / 7) ** 2))) // 12월 말 비쌌던 때
const jitter = (t: number) => 1 + 0.012 * Math.sin(t * 2.7) + 0.008 * Math.sin(t * 5.1)

function priceAt(t: number): number {
  if (t >= -60) return keyAt(t) * (KEYS.some(([k]) => k === t) ? 1 : jitter(t))
  if (t > -72) return older(t) + (keyAt(-60) - older(-60)) * smooth((t + 72) / 12)
  return older(t)
}

const TREND: TrendPoint[] = []
for (let t = -182; t <= 0; t++) {
  TREND.push({ date: addDays(SURVEYED_ON, t), price: round10(priceAt(t)), usual: round10(usualAt(t)) })
}

// 평년 흐름을 지금 값에 이어 붙인 예상: 4,400 → 4,000, 범위는 열흘에 걸쳐 ±500까지 벌어진다
const FORECAST_DAYS = 28
const FORECAST: ForecastPoint[] = []
for (let t = 1; t <= FORECAST_DAYS; t++) {
  const mid = 4400 + (4000 - 4400) * smooth((t - 1) / (FORECAST_DAYS - 1))
  const spread = 500 * Math.min(1, t / 10)
  FORECAST.push({ date: addDays(SURVEYED_ON, t), price: round10(mid), low: round10(mid - spread), high: round10(mid + spread) })
}

const chain = (name: string, samples: readonly number[], price: number): PlaceQuote => ({
  type: "large_retail",
  name,
  region: null,
  price,
  samples,
})
const market = (name: string, region: string, price: number): PlaceQuote => ({
  type: "traditional",
  name,
  region,
  price,
  samples: [price],
})

// KAMIS는 대형마트 이름을 B · C · E 같은 기호로 가려서 준다. 같은 기호는 전국이 같은 값인 경우가 많다.
const PLACES: readonly PlaceQuote[] = [
  chain("대형마트 C", Array(9).fill(3480), 3480),
  chain("대형마트 B", [3100, 3180, 3900, 3900, 3900, 3900, 3900], 3900),
  chain("그 밖의 대형마트", [3890, 4230, 4230, 5000], 4230),
  chain("대형마트 E", Array(9).fill(4990), 4990),
  market("신정시장", "울산", 4160),
  market("역전시장", "대전", 4250),
  market("양동시장", "광주", 4310),
  market("남부시장", "전주", 4330),
  market("육거리시장", "청주", 4330),
  market("복조리시장", "서울", 4440),
  market("경동시장", "서울", 4550),
  market("중앙시장", "춘천", 4880),
  market("현대시장", "인천", 5000),
  market("상남시장", "창원", 5000),
  market("역전시장", "순천", 5110),
  market("부전시장", "부산", 6000),
  market("지동시장", "수원", 6000),
  market("죽도시장", "포항", 6000),
  market("칠성시장", "대구", 6250),
  market("동문시장", "제주", 7530),
]

/** 배추 상세에서 목록 행(VarietySummary)에 없는 부분. */
export const BAECHU_DETAIL: Omit<VarietyDetail, keyof VarietySummary> = {
  band: { lower: -10, upper: 10 },
  range: { min: 3900, max: 5200, n: 45 },
  marketTypes: [
    { type: "large_retail", median: 3900, n: 29 },
    { type: "traditional", median: 4940, n: 16 },
  ],
  places: PLACES,
  trend: TREND,
  forecast: FORECAST,
  shelf: {
    surveyedOn: "2026-10-10",
    prices: [
      { seller: "홈플러스", price: 3990, promo: "행사 ~10/29" },
      { seller: "이마트", price: 4980, promo: null },
      { seller: "하나로마트", price: 5300, promo: null },
      { seller: "롯데마트", price: 5480, promo: null },
      { seller: "GS더프레시", price: 5900, promo: null },
    ],
  },
  basis: { source: "KAMIS", scope: "전국 조사 시장" },
}
