import { familiarity } from "./food-familiarity"
import { findFood, type Food, type FoodId } from "./foods"
import type { Month } from "./months"

// 제철 회 화면의 달별 품종(.scratch/sashimi/spec.md 4장).
// 원천은 사용자 첨부 「월별 제철 회 총정리」(2026-11-02, apps/web/docs/seafood-content/reference.json의 monthlyContent)다.
// 첨부 이름을 앱 품종 id로 옮겨 첨부 순서대로 적었다. 런타임에 JSON을 읽지 않는다.
// 첨부의 추천 월은 출처가 확인되지 않았다(.scratch/sashimi/research-months.md).

/** 첨부에 없지만 회로 먹어 더한 품종. 앱의 대표 달(peak)에 넣고, 그 달 첨부 품종 뒤에 둔다. */
export const ADDED_SASHIMI = [
  "squid",
  "east-sea-hanchi",
  "jeju-hanchi",
  "long-arm-octopus",
  "webfoot-octopus",
  "croaker",
  "pomfret",
] as const satisfies readonly FoodId[]

/**
 * 달 → 회 품종 id(추천 달). 적은 순서는 첨부 순서이고, 추가 품종이 뒤에 온다.
 * 화면의 그 달 목록은 sashimiInMonth가 제철 범위까지 넓혀 만든다.
 * 말쥐치·망둥어·밴댕이·능성어·불볼락은 첨부 달이 아니라 고친 앱 제철(food-season-corrections.json, 2026-11-03)을 따른다.
 */
export const SASHIMI_MONTHS: Readonly<Record<Month, readonly FoodId[]>> = {
  1: [
    "pufferfish",
    "roughscale-flounder",
    "searobin",
    "marbled-rockfish",
    "lumpfish",
    "herring",
    "skate",
    "banded-grouper",
  ],
  2: [
    "cod",
    "halfbeak",
    "redlip-mullet",
    "olive-flounder",
    "banded-grouper",
    "east-sea-hanchi",
  ],
  3: [
    "red-rockfish",
    "korean-rockfish",
    "red-seabream",
    "gray-rockfish",
    "spanish-mackerel",
    "mullet",
    "webfoot-octopus",
  ],
  4: [
    "spring-flounder",
    "ganjaemi",
    "yellowfin-flounder",
    "atka-mackerel",
    "red-rockfish",
    "long-arm-octopus",
    "webfoot-octopus",
  ],
  5: [
    "sixbar-sandperch",
    "anchovy",
    "sardinella",
    "pearl-spot-chromis",
    "sea-bass",
    "pomfret",
  ],
  6: [
    "chicken-grunt",
    "borimyeol",
    "pearl-spot-chromis",
    "sea-bass",
    "sardinella",
    "pomfret",
  ],
  7: [
    "conger-eel",
    "horse-mackerel",
    "blackfish",
    "borimyeol",
    "jeju-hanchi",
    "croaker",
  ],
  8: [
    "hairtail",
    "pike-conger",
    "yellowstripe-jack",
    "gizzard-shad",
    "squid",
    "croaker",
  ],
  9: [
    "gizzard-shad",
    "mackerel",
    "rock-bream",
    "black-scraper",
    "goedorachi",
    "goby",
  ],
  10: [
    "spanish-mackerel",
    "longtail-blackfish",
    "rabbitfish",
    "stone-flounder",
    "black-scraper",
    "goby",
    "long-arm-octopus",
  ],
  11: ["longtooth-grouper", "red-spotted-grouper"],
  12: [
    "pufferfish",
    "black-seabream",
    "yellowtail",
    "herring",
    "banded-grouper",
  ],
}

/** 회 화면에 나오는 품종 전부(첨부 48종 + 추가 7종). 처음 나온 달 순서. */
export const SASHIMI_IDS: readonly FoodId[] = [...new Set(Object.values(SASHIMI_MONTHS).flat())]

/** 그 달이 이 품종의 추천 달(첨부의 달, 추가 품종은 대표 달)인가. 화면에서 "추천" 표시에 쓴다. */
export function isSashimiPick(id: FoodId, month: number): boolean {
  return SASHIMI_MONTHS[month as Month]?.includes(id) ?? false
}

/**
 * 그 달 회 품종: 회 품종 가운데 그 달이 제철(food.months)이거나 추천 달인 것 전부.
 * 추천 달만 쓰면 품종마다 한 달에만 나와(11월에 방어·광어가 빠짐) 같은 사이트의 월별 제철과 어긋난다. SEO 감사 2026-11-04 F1.
 * 순서: 그 달 추천 품종이 앞(12월 방어처럼 그 달이 절정인 것을 먼저), 각 묶음 안은 친숙도 1→3, 같은 등급은 SASHIMI_MONTHS에 적은 순서.
 * 1~12 밖이면 빈 목록.
 */
export function sashimiInMonth(month: number): readonly Food[] {
  const picks: readonly FoodId[] = SASHIMI_MONTHS[month as Month] ?? []
  const order = (id: FoodId) => (picks.includes(id) ? picks.indexOf(id) : picks.length + SASHIMI_IDS.indexOf(id))
  return SASHIMI_IDS.map((id) => findFood(id)!)
    .filter((food) => picks.includes(food.id) || (food.months as readonly number[]).includes(month))
    .sort(
      (a, b) =>
        Number(!picks.includes(a.id)) - Number(!picks.includes(b.id)) ||
        familiarity(a.id) - familiarity(b.id) ||
        order(a.id) - order(b.id)
    )
}
