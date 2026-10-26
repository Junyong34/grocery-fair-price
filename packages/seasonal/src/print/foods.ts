import { monthCalendar } from "../calendar/month-calendar"
import { bestMonth, familiarity } from "../data/food-familiarity"
import { FOODS, isDrawn, isPeak, type Food, type FoodCategory } from "../data/foods"
import { MONTHS, orderSeasonMonths } from "../data/months"
import { seasonOfMonth, startSeason, type Season } from "../data/seasons"
import type { MonthlySpec, MonthPosterSpec, SeasonPosterSpec, YearSheetSpec } from "./spec"

// 인쇄물 칸(달·계절)에 넣을 품종 고르기. 화면은 칸 함수에 사양만 넘기고, 칸마다 몇 개를 어떤 차례로 넣을지, 그림이 없는 품종을 넣을지는 여기서 정한다.
// 인쇄물에는 그림이 있는 품종만 넣는다(이름 카드는 종이에서 빈 원으로 보인다). 예외는 이름만 적는 체크 목록이다.

/** 칸당 품종 상한 가운데 사양(foods.max)이 아니라 판 크기에서 정한 것. 값마다 근거는 그 판의 글자·그림 크기다. */
const PER_CELL = {
  /** 체크 목록(월간 M-B·메모, 월별 포스터 P-D). 한 달 제철이 최대 86개라, 넷씩 다섯 줄(A4 약 8pt)을 넘지 않게 대표만 적는다. */
  checklist: 20,
  /** 월별 포스터 원판(P-C) 조각 하나. 조각이 좁아 넷을 넘으면 그림이 작아진다. */
  wheelSector: 4,
  /** 월별 포스터 P-D 한 줄의 그림. 한 줄로만 놓고, 이보다 많으면 두 줄로 접혀 그림이 작아진다. 나머지는 체크 목록에 이름으로 있다. */
  rowPictures: 6,
  /** 월간 M-D 그림 띠. 그 달 대표부터 띠와 빈 날짜 칸에 넣고, 못 들어간 품종은 뺀다(한 달 제철이 31~86개라 띠는 늘 찬다). */
  strip: 14,
  /** 연간 Y-B 위 그림 판, 월간 표지 C-1. 달마다 둘이면 24개가 작게 흩어져 큰 그림으로 보이지 않았다. */
  yearHero: 1,
  /** 월간 표지 C-2 열두 달 칸. */
  coverMonth: 2,
  /** 막대표(월별 포스터 P-B, 월간 표지 C-3) 달마다. 여섯이면 많아야 72줄로, 그림 있는 품종 67개를 다 싣던 때와 글자 크기가 같다. */
  chart: 6,
  /** 연간 Y-C 막대표 달마다. 여섯(72개)이면 세로 2단 줄이 약 3.7mm(이름 약 6pt)라 넷(48개, 이름 세로 약 7.6pt·가로 약 7.4pt)으로 줄였다. */
  yearChart: 4,
} as const

type Pick = { max: number; categories: readonly FoodCategory[]; drawnOnly: boolean }

/** 사양에 카테고리 옵션이 있으면 그것, 없으면(월간·연간) 전부. */
const categoriesOf = (spec: object): readonly FoodCategory[] => ("categories" in spec ? (spec.categories as readonly FoodCategory[]) : [])

const pickable = ({ categories, drawnOnly }: Pick) => (food: Food) =>
  (!drawnOnly || isDrawn(food.id)) && (categories.length === 0 || categories.includes(food.category))

/** 칸의 주제(달·계절)에 대표 달이 걸리는 정도가 큰 품종부터, 친숙한 품종(familiarity), 처음부터 검증한 품종(core), 더 특별한(제철이 짧은) 품종, 이름순. */
const byFocus = (focus: (food: Food) => number) => (a: Food, b: Food) =>
  focus(b) - focus(a) ||
  familiarity(a.id) - familiarity(b.id) ||
  Number(b.core) - Number(a.core) ||
  a.months.length - b.months.length ||
  a.name.localeCompare(b.name, "ko")

const byMonth = (month: number) => byFocus((food) => Number(isPeak(food, month)))

function inMonth(month: number, pick: Pick): readonly Food[] {
  return FOODS.filter((food) => (food.months as readonly number[]).includes(month) && pickable(pick)(food))
    .sort(byMonth(month))
    .slice(0, pick.max)
}

/** 품종마다 최적 달(bestMonth) 한 곳에만 놓아 한 해에 한 번 나오고, 달마다 byMonth로 max개까지 고른다. 넘치는 품종은 싣지 않는다. */
function byBestMonth(pick: Pick): readonly (readonly Food[])[] {
  return MONTHS.map((month) =>
    FOODS.filter((food) => bestMonth(food) === month && pickable(pick)(food))
      .sort(byMonth(month))
      .slice(0, pick.max),
  )
}

/** 달 하나의 그림 칸. 월간(M-A·M-C·M-E, M-B의 그림), 월별 포스터(P-A 칸, P-C 원판 조각, P-D 줄 그림). M-A "그림 없음"은 빈 목록이다. */
export function monthPictures(spec: MonthlySpec | MonthPosterSpec, month: number): readonly Food[] {
  const max =
    spec.kind === "monthly"
      ? spec.layout === "none"
        ? 0
        : spec.foods.max
      : spec.layout === "wheel"
        ? Math.min(spec.foods.max, PER_CELL.wheelSector)
        : spec.layout === "rows-check"
          ? Math.min(spec.foods.max, PER_CELL.rowPictures)
          : spec.foods.max
  return inMonth(month, { max, categories: categoriesOf(spec), drawnOnly: true })
}

/** 이름만 적는 체크 목록(월간 M-B·메모 eaten-check, 월별 포스터 P-D). 글자라 그림이 없는 품종도 넣는다. 차례는 monthPictures와 같다. */
export function monthChecklist(spec: MonthlySpec | MonthPosterSpec, month: number): readonly Food[] {
  return inMonth(month, { max: PER_CELL.checklist, categories: categoriesOf(spec), drawnOnly: false })
}

/**
 * 쓰는 달력(월간 M-D)의 그림 나누기. 그 달 그림 있는 품종을 monthPictures 차례로 띠에 먼저 채우고,
 * 남은 것을 1일 앞·말일 뒤 빈 날짜 칸 수만큼 넣는다. 빈 칸 차례는 달력 칸 차례(앞 빈 칸 → 뒤 빈 칸)다. 그래도 남으면 dropped로 센다.
 */
export function stripFoods(spec: MonthlySpec, month: number): { strip: readonly Food[]; blanks: readonly Food[]; dropped: number } {
  const foods = inMonth(month, { max: Infinity, categories: [], drawnOnly: true })
  const blankCount = monthCalendar({ year: spec.year, month, today: { year: 0, month: 0, day: 0 }, holidays: {}, weekStart: spec.calendar.weekStart })
    .flat()
    .filter((cell) => cell === null).length
  const strip = foods.slice(0, PER_CELL.strip)
  const blanks = foods.slice(PER_CELL.strip, PER_CELL.strip + blankCount)
  return { strip, blanks, dropped: foods.length - strip.length - blanks.length }
}

/**
 * 열두 달을 한 판에 모을 때의 그림(1월부터 열두 묶음). 한 품종은 최적 달에 한 번만 나온다.
 * 연간 Y-A는 달마다 사양의 max개, Y-B 위 그림 판과 월간 표지 C-1은 하나, C-2는 둘.
 */
export function yearPictures(spec: YearSheetSpec | MonthlySpec): readonly (readonly Food[])[] {
  const max =
    spec.kind === "year-sheet"
      ? spec.layout === "hero-top"
        ? PER_CELL.yearHero
        : spec.foods.max
      : spec.cover === "months"
        ? PER_CELL.coverMonth
        : PER_CELL.yearHero
  return byBestMonth({ max, categories: [], drawnOnly: true })
}

/** 제철 막대표(연간 Y-C, 월간 표지 C-3, 월별 포스터 P-B)에 실을 품종. 고른 카테고리(없으면 전부)에서 달마다 대표 몇 개, 한 품종은 한 번. */
export function chartFoods(spec: YearSheetSpec | MonthlySpec | MonthPosterSpec): readonly Food[] {
  const max = spec.kind === "year-sheet" ? PER_CELL.yearChart : PER_CELL.chart
  return byBestMonth({ max, categories: categoriesOf(spec), drawnOnly: true }).flat()
}

/**
 * 계절 포스터의 계절 하나. 그 계절에 대표 달(peak)이 시작하는 품종을 고른다. 많으면 그 계절에 대표 달이 많은 것부터 byFocus 차례로 max개를 고르고,
 * 놓는 차례는 시작 달 순서, 같으면 이름순이다. 대표 달로 나누므로 시장 범위가 넓어도 한 품종은 한 계절에만 나온다.
 */
export function seasonPictures(spec: SeasonPosterSpec, season: Season): readonly Food[] {
  const pick: Pick = { max: spec.foods.max, categories: spec.categories, drawnOnly: true }
  const start = (food: Food) => orderSeasonMonths(food.peak)[0]!
  const order = (month: number) => (month - (season === "winter" ? 12 : 0) + 12) % 12
  const peaksIn = (food: Food) => food.peak.filter((month) => seasonOfMonth(month) === season).length
  return FOODS.filter((food) => startSeason(food.peak) === season && pickable(pick)(food))
    .sort(byFocus(peaksIn))
    .slice(0, pick.max)
    .sort((a, b) => order(start(a)) - order(start(b)) || a.name.localeCompare(b.name, "ko"))
}
