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
 * 달 → 회 품종 id(첨부의 달). "이달 추천" 표시는 이 목록과 친숙도·대표 달로 정한다(isSashimiPick). 적은 순서는 첨부 순서이고, 추가 품종이 뒤에 온다.
 * 화면의 그 달 목록은 sashimiInMonth가 제철 범위까지 넓혀 만든다.
 * 말쥐치·망둥어·밴댕이·능성어·불볼락은 첨부 달이 아니라 고친 앱 제철(food-registry.json의 근거, 2026-11-03)을 따른다.
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

/** 신규 수산 품종 중 회·숙회로 다루는 품종. 목록은 앱의 제철 범위, 추천은 대표 달을 따른다. */
const SASHIMI_FROM_FOOD_SEASONS = [
  "cuttlefish",
  "pointhead-flounder",
  "octopus",
  "trout",
  "fat-greenling",
  "bluefin-tuna",
] as const satisfies readonly FoodId[]

/** 회 화면에 나오는 품종 전부. 기존 추천표 순서 뒤에 앱 제철 범위를 따르는 품종을 더한다. */
export const SASHIMI_IDS: readonly FoodId[] = [
  ...new Set([...Object.values(SASHIMI_MONTHS).flat(), ...SASHIMI_FROM_FOOD_SEASONS]),
]

/**
 * "이달 추천" 표시. 친숙도 1~3(흔히 사 먹는 회) 가운데 그 달이 첨부의 달이거나 앱 대표 달(peak)인 품종.
 * 첨부 달만 쓰면 11월 추천이 자바리·붉바리처럼 비싸고 드문 회뿐이라, 장보기 서비스의 "추천"과 맞지 않았다(2026-11-06).
 * 제철 범위(months) 전부로 넓히면 한 달 목록 대부분에 붙어 표시가 의미를 잃어 대표 달까지만 본다.
 * 친숙도 4·5 품종은 추천하지 않고 목록에만 남긴다.
 */
export function isSashimiPick(id: FoodId, month: number): boolean {
  const food = findFood(id)
  if (!food || familiarity(id) > 3) return false
  return (
    (SASHIMI_MONTHS[month as Month]?.includes(id) ?? false) ||
    (food.peak as readonly number[]).includes(month)
  )
}

/**
 * 그 달 회 품종: 회 품종 가운데 그 달이 제철(food.months)이거나 첨부 달인 것 전부.
 * 첨부 달만 쓰면 품종마다 한 달에만 나와(11월에 방어·광어가 빠짐) 같은 사이트의 월별 제철과 어긋난다. SEO 감사 2026-11-04 F1.
 * 순서: 이달 추천 가운데 첨부 달 품종(12월 방어처럼 그 달이 절정인 것), 대표 달로 더한 추천, 나머지 순. 각 묶음 안은 친숙도 1→5, 같은 등급은 그 달 첨부 품종을 적은 순서로 먼저, 나머지는 SASHIMI_IDS 순서.
 * 1~12 밖이면 빈 목록.
 */
export function sashimiInMonth(month: number): readonly Food[] {
  const listed: readonly FoodId[] = SASHIMI_MONTHS[month as Month] ?? []
  const order = (id: FoodId) => (listed.includes(id) ? listed.indexOf(id) : listed.length + SASHIMI_IDS.indexOf(id))
  // 0: 첨부 달 추천, 1: 대표 달로 더한 추천, 2: 나머지
  const rank = (id: FoodId) => (!isSashimiPick(id, month) ? 2 : listed.includes(id) ? 0 : 1)
  return SASHIMI_IDS.map((id) => findFood(id)!)
    .filter((food) => listed.includes(food.id) || (food.months as readonly number[]).includes(month))
    .sort(
      (a, b) =>
        rank(a.id) - rank(b.id) ||
        familiarity(a.id) - familiarity(b.id) ||
        order(a.id) - order(b.id)
    )
}
