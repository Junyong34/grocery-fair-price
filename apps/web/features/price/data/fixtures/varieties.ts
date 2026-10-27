// 하드코딩 품종 목록. 값은 가격 판정 와이어프레임(2026-10-27)의 샘플이고, slug는 품종 카탈로그
// (packages/price-ingest/src/catalog/varieties.ts)를 따른다. 카탈로그에 없는 품종(단호박, 호주산 등심)은 임시 slug다.

import type { SearchAlias, VarietySummary } from "@workspace/price/types"
import { DEFAULT_BAND, verdictOf } from "@workspace/price/verdict"

/** 가장 최근 조사일 */
export const SURVEYED_ON = "2026-10-23"

/** 카테고리, 보여 줄 순서대로 */
export const CATEGORIES = ["채소", "과일", "정육·계란", "수산", "쌀·잡곡"] as const

type Row = {
  id: string
  name: string
  category: (typeof CATEGORIES)[number]
  item: string
  baseUnit: string
  price: number
  /** null이면 평소가가 아직 없는 품종(판정 전) */
  usual: number | null
  spec?: string
  /** 조사 시장 수. 기본 45 */
  n?: number
  /** 조사일이 SURVEYED_ON보다 오래된 품종(갱신 지연) */
  surveyedOn?: string
}

const ROWS: readonly Row[] = [
  { id: "napa-cabbage", name: "배추", category: "채소", item: "배추", baseUnit: "1포기", price: 4500, usual: 4150, spec: "상품" },
  { id: "baby-napa-cabbage", name: "알배기배추", category: "채소", item: "배추", baseUnit: "1포기", price: 2900, usual: 2700, spec: "상품" },
  { id: "eolgari-cabbage", name: "얼갈이배추", category: "채소", item: "배추", baseUnit: "100g", price: 520, usual: 560 },
  { id: "cabbage", name: "양배추", category: "채소", item: "양배추", baseUnit: "1포기", price: 3600, usual: 3050, spec: "상품" },
  { id: "radish", name: "무", category: "채소", item: "무", baseUnit: "1개", price: 2100, usual: 2440, spec: "상품" },
  { id: "spinach", name: "시금치", category: "채소", item: "잎채소", baseUnit: "100g", price: 1180, usual: 1340 },
  { id: "lettuce", name: "상추", category: "채소", item: "잎채소", baseUnit: "100g", price: 1450, usual: 1410 },
  { id: "perilla-leaf", name: "깻잎", category: "채소", item: "잎채소", baseUnit: "100g", price: 1890, usual: 1640 },
  { id: "korean-zucchini", name: "애호박", category: "채소", item: "호박", baseUnit: "1개", price: 1650, usual: 2090 },
  { id: "kabocha", name: "단호박", category: "채소", item: "호박", baseUnit: "1개", price: 3200, usual: 3050 },
  { id: "zucchini", name: "쥬키니", category: "채소", item: "호박", baseUnit: "1개", price: 1900, usual: null },
  { id: "potato", name: "감자", category: "채소", item: "뿌리채소", baseUnit: "100g", price: 420, usual: 430, spec: "상품" },
  { id: "sweet-potato", name: "고구마", category: "채소", item: "뿌리채소", baseUnit: "100g", price: 590, usual: 560, spec: "상품" },
  { id: "carrot", name: "당근", category: "채소", item: "뿌리채소", baseUnit: "100g", price: 380, usual: 370, spec: "상품" },
  { id: "onion", name: "양파", category: "채소", item: "양념채소", baseUnit: "100g", price: 340, usual: 382 },
  { id: "green-onion", name: "대파", category: "채소", item: "양념채소", baseUnit: "100g", price: 410, usual: 331 },
  // 표본이 적은 품종: 조사한 곳이 3곳뿐
  { id: "scallion", name: "쪽파", category: "채소", item: "양념채소", baseUnit: "100g", price: 980, usual: 940, n: 3 },
  { id: "peeled-garlic-kr", name: "깐마늘(국산)", category: "채소", item: "양념채소", baseUnit: "100g", price: 1520, usual: 1480, spec: "상품" },
  { id: "apple", name: "사과", category: "과일", item: "사과", baseUnit: "1개", price: 2980, usual: 2500, spec: "상품" },
  { id: "pear", name: "배", category: "과일", item: "배", baseUnit: "1개", price: 4200, usual: 4120, spec: "상품" },
  { id: "mandarin", name: "감귤", category: "과일", item: "감귤", baseUnit: "100g", price: 560, usual: 640, spec: "상품" },
  { id: "shine-muscat", name: "샤인머스켓", category: "과일", item: "포도", baseUnit: "100g", price: 1250, usual: null },
  { id: "pork-belly", name: "삼겹살(국산)", category: "정육·계란", item: "돼지고기", baseUnit: "100g", price: 2914, usual: 2750, spec: "냉장" },
  { id: "hanwoo-sirloin", name: "한우 등심", category: "정육·계란", item: "소고기", baseUnit: "100g", price: 13800, usual: 14400, spec: "1+" },
  { id: "au-beef-sirloin", name: "호주산 등심", category: "정육·계란", item: "소고기", baseUnit: "100g", price: 4650, usual: null, spec: "냉장" },
  { id: "egg", name: "계란", category: "정육·계란", item: "계란", baseUnit: "10구", price: 3450, usual: 3300, spec: "특란" },
  { id: "mackerel-kr", name: "고등어", category: "수산", item: "고등어", baseUnit: "1마리", price: 3900, usual: 4600, spec: "냉장" },
  { id: "ocean-squid", name: "오징어", category: "수산", item: "오징어", baseUnit: "1마리", price: 6200, usual: 5080, spec: "냉동" },
  // 갱신 지연: 마지막 조사가 2주 전
  { id: "hairtail-kr", name: "갈치", category: "수산", item: "갈치", baseUnit: "1마리", price: 9800, usual: 9500, spec: "냉동", surveyedOn: "2026-10-09" },
  { id: "rice", name: "쌀", category: "쌀·잡곡", item: "쌀", baseUnit: "1kg", price: 3150, usual: 3050, spec: "일반" },
  { id: "glutinous-rice", name: "찹쌀", category: "쌀·잡곡", item: "쌀", baseUnit: "1kg", price: 4100, usual: null },
]

/** 품종 목록(가나다순이 아니라 카테고리 · 와이어프레임 순서). */
export const VARIETIES: readonly VarietySummary[] = ROWS.map((row) => {
  const n = row.n ?? 45
  return {
    id: row.id,
    name: row.name,
    item: row.item,
    category: row.category,
    spec: row.spec ?? null,
    baseUnit: row.baseUnit,
    price: row.price,
    usual: row.usual,
    verdict: verdictOf(row.price, row.usual, DEFAULT_BAND),
    surveyedOn: row.surveyedOn ?? SURVEYED_ON,
    sampleSize: n,
    stale: row.surveyedOn != null,
    // 최소 표본 수 기준(②)이 정해지기 전이라 임시로 5곳
    meetsMinN: n >= 5,
  }
})

/** 별칭: 사용자가 쓰는 다른 이름 */
export const ALIASES: readonly SearchAlias[] = [
  { text: "대패삼겹", varietyId: "pork-belly" },
  { text: "대패", varietyId: "pork-belly" },
  { text: "파", varietyId: "green-onion" },
  { text: "귤", varietyId: "mandarin" },
  { text: "샤인", varietyId: "shine-muscat" },
  { text: "달걀", varietyId: "egg" },
  { text: "쇠고기", item: "소고기" },
]

/** 자주 사는 품종: 운영자가 정한 고정 목록(2026-10-27 결정, 검색 기록을 모으게 되면 바꾼다). */
export const FEATURED_IDS: readonly string[] = ["egg", "onion", "apple", "mackerel-kr", "korean-zucchini", "shine-muscat"]
