// 대표 품종 고르기. 그 달·계절 제철 품종이 많아(한 달 최대 92개) 판·카드·검색 설명·인쇄물 칸에는 앞에서 몇 개만 싣는다.
// 무엇을 앞에 둘지는 쓰는 곳마다 다르다. 그 차이를 RANKINGS 한 표에 나란히 적고, 정렬 기준 조각(KEYS)은 모두가 같은 것을 쓴다.
// 인쇄물 칸의 개수·그림 유무·카테고리 거르기는 print/foods.ts가 정하고, 차례는 여기 RANKINGS를 쓴다.
import { familiarity } from "./food-familiarity"
import { foodsInMonth, foodsInSeason, isDrawn, isPeak, type Food, type FoodCategory, type FoodId } from "./foods"
import type { Month } from "./months"
import { SEASON_MONTHS, type Season } from "./seasons"

/**
 * MONTH_NOTES에 이름이 나오는 품종. 이달 판(featured-foods.ts monthHighlights)이 이 품종을 대표 품종 맨 앞에 넣어 문구와 그림이 어긋나지 않게 한다.
 * copy.ts의 MONTH_NOTES를 바꾸면 이 목록도 함께 고친다. 인쇄물이 이 모듈을 읽어서 copy.ts를 불러오지 않으려고 문구 옆이 아니라 여기 둔다. 품종이 그 달 문구에 나오고 그 달 제철인지는 featured-foods.test.ts가 본다.
 */
export const MONTH_NOTE_FOODS: Partial<Record<Month, readonly FoodId[]>> = {
  1: ["oyster"],
  2: ["bomdong"],
  3: ["shepherds-purse", "wild-chive"],
  4: ["aralia-shoot"],
  5: ["green-pea"],
  6: ["green-plum", "potato"],
  7: ["young-radish", "watermelon"],
  8: ["peach"],
  10: ["chestnut", "sweet-potato"],
  11: ["napa-cabbage", "radish"],
  12: ["mandarin"],
}

/** 정렬 기준 하나. 값이 작은 품종이 앞이다. 숫자가 같으면 다음 기준으로 넘어간다. 문자열은 가나다순이다. */
export type RankKey = ((food: Food) => number | string) & { readonly name: string }

const key = (name: string, value: (food: Food) => number | string): RankKey => Object.defineProperty(value, "name", { value: name }) as RankKey

const countIn = (months: readonly number[], season: Season) => months.filter((month) => SEASON_MONTHS[season].includes(month)).length

/** 정렬 기준 조각. 이름(name)은 RANKINGS를 읽고 테스트할 때 쓴다. */
const KEYS = {
  /** 그 달 문구(MONTH_NOTES)에 나오는 품종 먼저. */
  mentioned: (month: number) => key("mentioned", (food) => Number(!(MONTH_NOTE_FOODS[month as Month] ?? []).includes(food.id))),
  /** 그림이 있는 품종 먼저. */
  drawn: key("drawn", (food) => Number(!isDrawn(food.id))),
  /** 그 달이 대표 달(peak)인 품종 먼저. */
  peak: (month: number) => key("peak", (food) => Number(!isPeak(food, month))),
  /** 그 계절에 대표 달이 많은 품종 먼저. */
  peaksIn: (season: Season) => key("peaksIn", (food) => -countIn(food.peak, season)),
  /** 그 계절에 제철인 달이 많은 품종 먼저. */
  monthsIn: (season: Season) => key("monthsIn", (food) => -countIn(food.months, season)),
  /** 친숙한(등급 숫자가 작은) 품종 먼저. */
  familiarity: key("familiarity", (food) => familiarity(food.id)),
  /** 친숙도 1·2등급만 가르고 3~5등급은 같은 묶음으로 본다. */
  familiarityUpTo3: key("familiarityUpTo3", (food) => Math.min(familiarity(food.id), 3)),
  /** 처음부터 조사로 검증한 품종(core) 먼저. */
  core: key("core", (food) => Number(!food.core)),
  /** 제철이 짧은(그 철에만 가까운) 품종 먼저. */
  short: key("short", (food) => food.months.length),
  /** 이름 가나다순. */
  name: key("name", (food) => food.name),
} as const

/**
 * 쓰는 곳마다의 정렬 기준. 앞의 기준부터 비교한다.
 * - monthBoard: 2a 이달 판, 2b 묶음 안, 달 검색 설명. 화면은 그림으로 보여 주므로 친숙도보다 그림·대표 달이 먼저다.
 * - seasonCard: 3a 계절 카드. 카드에 크게 그리므로 그림이 있는 품종부터, 그 계절에 대표 달·제철 달이 많은 품종. 같으면 FOODS 차례(가나다)다.
 * - printMonth: 인쇄물 달 칸. 친숙도가 대표 달보다 먼저라, 대표 달인 낯선 품종이 제철인 흔한 품종을 밀어내지 않는다(.scratch/food-familiarity/spec.md).
 * - printCategoryMonth: 카테고리를 고른 인쇄물의 달 칸. 칸이 적어 친숙도만으로 고르면 대표 달이 아닌 3등급(5월 애플망고)이
 *   대표 달인 4등급(5월 카라향)을 밀어냈다. 1·2등급은 먼저 넣고, 3~5등급끼리는 대표 달인 품종을 먼저 넣는다.
 * - printSeason: 계절 포스터. 친숙도, 그 계절에 대표 달이 많은 품종.
 */
const printMonth = (month: number): readonly RankKey[] => [KEYS.familiarity, KEYS.peak(month), KEYS.core, KEYS.short, KEYS.name]

export const RANKINGS = {
  monthBoard: (month: number) => [KEYS.mentioned(month), KEYS.drawn, KEYS.peak(month), KEYS.core, KEYS.short, KEYS.name],
  seasonCard: (season: Season) => [KEYS.drawn, KEYS.peaksIn(season), KEYS.monthsIn(season)],
  printMonth,
  printCategoryMonth: (month: number) => [KEYS.familiarityUpTo3, KEYS.peak(month), ...printMonth(month)],
  printSeason: (season: Season) => [KEYS.familiarity, KEYS.peaksIn(season), KEYS.core, KEYS.short, KEYS.name],
} satisfies Record<string, (focus: never) => readonly RankKey[]>

/** 기준 차례대로 정렬한 새 목록. 모든 기준이 같으면 들어온 차례를 지킨다. */
export function rankFoods(foods: readonly Food[], keys: readonly RankKey[]): Food[] {
  return [...foods].sort((a, b) => {
    for (const rank of keys) {
      const x = rank(a)
      const y = rank(b)
      const order = typeof x === "string" && typeof y === "string" ? x.localeCompare(y, "ko") : Number(x) - Number(y)
      if (order !== 0) return order
    }
    return 0
  })
}

/**
 * 그 달을 대표하는 품종(2a 흩뿌리기 판, 검색 설명). 판에는 앞에서 몇 개만 그리고 나머지는 이름 목록으로 둔다.
 */
export function monthHighlights(month: number, count: number): readonly Food[] {
  return rankFoods(foodsInMonth(month), RANKINGS.monthBoard(month)).slice(0, count)
}

/** 계절 대표 품종(3a 계절 카드). 그림이 모자라면 그림 없는 품종으로 채운다. 그림 목록이 늘면 결과도 바뀐다. */
export function seasonHighlights(season: Season, count: number): readonly Food[] {
  return rankFoods(foodsInSeason(season), RANKINGS.seasonCard(season)).slice(0, count)
}

/** 월별 화면(2b)에서 카테고리를 늘어놓는 순서. 장보기 동선(채소·과일 → 수산 → 나머지). */
export const MONTH_CATEGORY_ORDER = ["채소", "과일", "수산", "버섯", "곡물·견과"] as const satisfies readonly FoodCategory[]

/**
 * 그 달 품종을 카테고리별로 묶는다(2b 월별 화면의 소제목, "11월 제철 생선" 같은 검색에 답하는 묶음).
 * 묶음 안은 monthHighlights 순서라 대표 품종이 앞에 온다.
 */
export function foodsInMonthByCategory(month: number): { category: FoodCategory; foods: readonly Food[] }[] {
  const ordered = monthHighlights(month, foodsInMonth(month).length)
  const order: readonly FoodCategory[] = MONTH_CATEGORY_ORDER
  const rest = [...new Set(ordered.map((food) => food.category))].filter((category) => !order.includes(category))
  return [...order, ...rest]
    .map((category) => ({ category, foods: ordered.filter((food) => food.category === category) }))
    .filter((group) => group.foods.length > 0)
}
