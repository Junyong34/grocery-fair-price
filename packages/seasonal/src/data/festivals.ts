import type { CalendarDate } from "../calendar/month-calendar"
import type { FoodId } from "./foods"

/** 명절에 차려 먹는 요리. 품종이 아니므로 품종 상세로 연결하지 않는다. */
export type TraditionalDish = string

/**
 * 명절 목록. month는 대표 양력 월로, 다가오는 명절을 고를 때 쓴다.
 * dates는 연도별 양력 날짜("월-일")다. 표에 없는 연도면 날짜를 보여 주지 않는다. 삼복처럼 하루로 정할 수 없으면 비워 둔다.
 * 날짜·전통 음식 출처: prototypes/seasonal-food/scripts/build_seasonal_lists.py의 HOLIDAYS. 설날·추석 날짜는 holidays-kr(관보)와 같다.
 */
export const FESTIVALS = [
  {
    slug: "seollal",
    name: "설날",
    month: 2,
    period: "음력 1월 1일",
    dates: { 2026: "2-17", 2027: "2-7" },
    traditionalDishes: ["떡국", "만두", "식혜", "수정과"],
    seasonalFoodIds: ["spinach", "snow-crab", "hallabong", "bomdong"],
  },
  {
    slug: "daeboreum",
    name: "정월대보름",
    month: 3,
    period: "음력 1월 15일",
    dates: { 2026: "3-3", 2027: "2-21" },
    traditionalDishes: ["오곡밥", "묵은 나물", "부럼", "귀밝이술"],
    seasonalFoodIds: ["shepherds-purse", "wild-chive", "mugwort", "water-dropwort"],
  },
  {
    slug: "dano",
    name: "단오",
    month: 6,
    period: "음력 5월 5일",
    dates: { 2026: "6-19", 2027: "6-9" },
    traditionalDishes: ["수리취떡", "제호탕"],
    seasonalFoodIds: ["green-plum", "potato", "black-raspberry", "apricot"],
  },
  {
    slug: "sambok",
    name: "삼복",
    month: 7,
    period: "초복(하지 뒤 셋째 경일)부터 말복(입추 뒤 첫 경일)까지, 7월 중순~8월 중순",
    dates: {},
    traditionalDishes: ["삼계탕", "육개장", "팥죽"],
    seasonalFoodIds: ["corn", "watermelon", "brown-croaker", "conger-eel"],
  },
  {
    slug: "chuseok",
    name: "추석",
    month: 9,
    period: "음력 8월 15일",
    dates: { 2026: "9-25", 2027: "9-15" },
    traditionalDishes: ["송편", "토란탕", "화양적", "닭찜"],
    seasonalFoodIds: ["gizzard-shad", "pear", "apple", "chestnut"],
  },
  {
    slug: "dongji",
    name: "동지",
    month: 12,
    period: "양력 12월 22일 무렵",
    dates: { 2026: "12-22", 2027: "12-22" },
    traditionalDishes: ["팥죽", "동치미"],
    seasonalFoodIds: ["yellowtail", "mandarin", "oyster", "napa-cabbage"],
  },
] as const satisfies readonly {
  slug: string
  name: string
  month: number
  period: string
  dates: Partial<Record<number, `${number}-${number}`>>
  traditionalDishes: readonly TraditionalDish[]
  seasonalFoodIds: readonly FoodId[]
}[]

export type Festival = (typeof FESTIVALS)[number]["slug"]

export function isFestival(value: string): value is Festival {
  return FESTIVALS.some((festival) => festival.slug === value)
}

/** month(1~12) 이후 가장 가까운 명절. 그해 명절이 다 지났으면 다음 해 첫 명절. */
export function upcomingFestival(month: number): Festival {
  return (FESTIVALS.find((festival) => festival.month >= month) ?? FESTIVALS[0]).slug
}

/** 그해 명절의 양력 날짜. 날짜 표에 없는 연도이거나 하루로 정할 수 없는 명절이면 null이다. */
export function festivalDate(slug: Festival, year: number): CalendarDate | null {
  const festival = FESTIVALS.find((candidate) => candidate.slug === slug)!
  const monthDay = (festival.dates as Partial<Record<number, string>>)[year]
  if (!monthDay) return null
  const [month, day] = monthDay.split("-").map(Number)
  return { year, month: month!, day: day! }
}
