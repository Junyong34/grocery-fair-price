import { monthCalendar } from "../calendar/month-calendar"
import { FOODS, isDrawn, type Food, type FoodCategory } from "../data/foods"
import { MONTHS, orderSeasonMonths } from "../data/months"
import { seasonOfMonth, type Season } from "../data/seasons"

// 인쇄물 칸(달·계절)에 넣을 품종 고르기. 인쇄물에는 그림이 있는 품종만 넣는다(이름 카드는 종이에서 빈 원으로 보인다).

export type FoodPick = { max: number; categories: readonly FoodCategory[] }

const pickable = ({ categories }: FoodPick) => (food: Food) =>
  isDrawn(food.id) && (categories.length === 0 || categories.includes(food.category))

const inMonth = (month: number) => (food: Food) => (food.months as readonly number[]).includes(month)
const byMonthOrder = (a: Food, b: Food) => a.months.length - b.months.length || a.name.localeCompare(b.name, "ko")

/** 그 달 품종. 그 달에 더 특별한(제철이 짧은) 품종부터, 같으면 이름순. */
export function monthFoods(month: number, pick: FoodPick): readonly Food[] {
  return FOODS.filter((food) => inMonth(month)(food) && pickable(pick)(food))
    .sort(byMonthOrder)
    .slice(0, pick.max)
}

/** 이름만 적는 체크 목록(월별 포스터 P-D)의 그 달 품종. 글자라 그림이 없는 품종도 넣는다. 차례는 monthFoods와 같다. */
export function monthChecklist(month: number, categories: readonly FoodCategory[]): readonly Food[] {
  return FOODS.filter((food) => inMonth(month)(food) && (categories.length === 0 || categories.includes(food.category))).sort(byMonthOrder)
}

/** 열두 달을 한 판에 모을 때의 품종. 달마다 앞 달에 아직 나오지 않은 품종을 pick.max개까지 고른다(여러 달에 걸친 품종이 두 번 나오지 않게). */
export function yearFoods(pick: FoodPick): readonly Food[] {
  const picked = new Set<string>()
  return MONTHS.flatMap((month) => {
    const fresh = monthFoods(month, { ...pick, max: Infinity }).filter((food) => !picked.has(food.id)).slice(0, pick.max)
    fresh.forEach((food) => picked.add(food.id))
    return fresh
  })
}

/** 제철이 시작하는 달의 계절. 여러 계절에 걸친 품종을 포스터의 한 계절에만 놓을 때 쓴다. */
export function startSeason(months: readonly number[]): Season {
  return seasonOfMonth(orderSeasonMonths(months)[0]!)
}

/** 그 계절에 제철이 시작하는 품종. 시작 달 순서, 같으면 이름순. */
export function seasonFoods(season: Season, pick: FoodPick): readonly Food[] {
  const start = (food: Food) => orderSeasonMonths(food.months)[0]!
  const order = (month: number) => (month - (season === "winter" ? 12 : 0) + 12) % 12
  return FOODS.filter((food) => startSeason(food.months) === season && pickable(pick)(food))
    .sort((a, b) => order(start(a)) - order(start(b)) || a.name.localeCompare(b.name, "ko"))
    .slice(0, pick.max)
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
