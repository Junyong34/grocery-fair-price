import { monthCalendar } from "../calendar/month-calendar"
import { FOODS, isDrawn, type Food, type FoodCategory } from "../data/foods"
import { MONTHS, orderSeasonMonths } from "../data/months"
import { seasonOfMonth, type Season } from "../data/seasons"

// 인쇄물 칸(달·계절)에 넣을 품종 고르기. 인쇄물에는 그림이 있는 품종만 넣는다(이름 카드는 종이에서 빈 원으로 보인다).

export type FoodPick = { max: number; categories: readonly FoodCategory[] }

const pickable = ({ categories }: FoodPick) => (food: Food) =>
  isDrawn(food.id) && (categories.length === 0 || categories.includes(food.category))

const inMonth = (month: number) => (food: Food) => (food.months as readonly number[]).includes(month)
const isPeak = (food: Food, month: number) => (food.peak as readonly number[]).includes(month)
/** 그 달이 대표 달(peak)인 품종부터, 처음부터 검증한 품종(core), 그 달에 더 특별한(제철이 짧은) 품종, 이름순. 칸에 다 못 넣으면 앞에서 자른다. */
const byMonthOrder = (month: number) => (a: Food, b: Food) =>
  Number(isPeak(b, month)) - Number(isPeak(a, month)) ||
  Number(b.core) - Number(a.core) ||
  a.months.length - b.months.length ||
  a.name.localeCompare(b.name, "ko")

/** 그 달 품종. 차례는 byMonthOrder. */
export function monthFoods(month: number, pick: FoodPick): readonly Food[] {
  return FOODS.filter((food) => inMonth(month)(food) && pickable(pick)(food))
    .sort(byMonthOrder(month))
    .slice(0, pick.max)
}

/** 체크 목록에 적는 품종 수의 상한. 한 달 제철이 최대 86개라, 넷씩 다섯 줄(A4 약 8pt)을 넘지 않게 대표만 적는다. */
export const CHECKLIST_MAX = 20

/** 이름만 적는 체크 목록(월간 M-B·메모, 월별 포스터 P-D)의 그 달 품종. 글자라 그림이 없는 품종도 넣는다. 차례는 monthFoods와 같다. */
export function monthChecklist(month: number, categories: readonly FoodCategory[]): readonly Food[] {
  return FOODS.filter((food) => inMonth(month)(food) && (categories.length === 0 || categories.includes(food.category)))
    .sort(byMonthOrder(month))
    .slice(0, CHECKLIST_MAX)
}

/** 열두 달을 한 판에 모을 때의 품종. 달마다 앞 달에 아직 나오지 않은 품종을 pick.max개까지 고른다(여러 달에 걸친 품종이 두 번 나오지 않게). */
export function yearFoods(pick: FoodPick): readonly Food[] {
  return yearFoodsByMonth(pick).flat()
}

/** yearFoods를 달마다 묶은 것(1월부터 열두 묶음). 월간 표지 열두 달 미리보기(C-2)가 칸마다 쓴다. */
export function yearFoodsByMonth(pick: FoodPick): readonly (readonly Food[])[] {
  const picked = new Set<string>()
  return MONTHS.map((month) => {
    const fresh = monthFoods(month, { ...pick, max: Infinity }).filter((food) => !picked.has(food.id)).slice(0, pick.max)
    fresh.forEach((food) => picked.add(food.id))
    return fresh
  })
}

/** 제철이 시작하는 달의 계절. 여러 계절에 걸친 품종을 포스터의 한 계절에만 놓을 때 쓴다. 대표 달(peak)을 넘기면 시장 범위가 넓어도 대표 계절에 놓인다. */
export function startSeason(months: readonly number[]): Season {
  return seasonOfMonth(orderSeasonMonths(months)[0]!)
}

/**
 * 그 계절에 대표 달(peak)이 시작하는 품종. 많으면 그 계절에 대표 달이 많은 것, 처음부터 검증한 것(core), 제철이 짧은 것부터 pick.max개를 고르고,
 * 놓는 차례는 시작 달 순서, 같으면 이름순이다.
 */
export function seasonFoods(season: Season, pick: FoodPick): readonly Food[] {
  const start = (food: Food) => orderSeasonMonths(food.peak)[0]!
  const order = (month: number) => (month - (season === "winter" ? 12 : 0) + 12) % 12
  const peaksIn = (food: Food) => food.peak.filter((month) => seasonOfMonth(month) === season).length
  return FOODS.filter((food) => startSeason(food.peak) === season && pickable(pick)(food))
    .sort((a, b) => peaksIn(b) - peaksIn(a) || Number(b.core) - Number(a.core) || a.months.length - b.months.length || a.name.localeCompare(b.name, "ko"))
    .slice(0, pick.max)
    .sort((a, b) => order(start(a)) - order(start(b)) || a.name.localeCompare(b.name, "ko"))
}

/**
 * 쓰는 달력(월간 M-D)의 그림 나누기. 그 달 그림 있는 품종을 monthFoods 차례로 띠에 stripSize개까지 먼저 채우고,
 * 남은 것을 1일 앞·말일 뒤 빈 날짜 칸 수만큼 넣는다. 빈 칸 차례는 달력 칸 차례(앞 빈 칸 → 뒤 빈 칸)다. 그래도 남으면 dropped로 센다.
 */
export function stripFoods({ year, month, weekStart, stripSize }: { year: number; month: number; weekStart: 0 | 1; stripSize: number }): {
  strip: readonly Food[]
  blanks: readonly Food[]
  dropped: number
} {
  const foods = monthFoods(month, { max: Infinity, categories: [] })
  const blankCount = monthCalendar({ year, month, today: { year: 0, month: 0, day: 0 }, holidays: {}, weekStart })
    .flat()
    .filter((cell) => cell === null).length
  const strip = foods.slice(0, stripSize)
  const blanks = foods.slice(stripSize, stripSize + blankCount)
  return { strip, blanks, dropped: foods.length - strip.length - blanks.length }
}
