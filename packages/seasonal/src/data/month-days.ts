import { lunarToSolar, winterSolstice } from "../calendar/lunar"
import type { CalendarDate } from "../calendar/month-calendar"
import { solarTermDate } from "../calendar/solar-terms"
import { FESTIVALS, festivalDate, type Festival } from "./festivals"

// 달력 아래 "이달의 절기·명절" 목록. 명절(festivals.ts)에 대표 절기와 세시(복날·한식·단오·칠석)를 더해 날짜 순으로 놓는다.
// 24절기는 다 넣지 않고 흔히 말하는 것만 고른다(입춘·입추처럼 계절이 바뀌는 날, 낮밤 길이가 바뀌는 날, 추위·더위 고비).
// 한 줄 설명은 copy.ts의 MONTH_DAY_NOTES에 있다.

/** festival: 명절, solar-term: 24절기, custom: 절기가 아닌 세시(복날·한식·단오·칠석) */
export type MonthDayKind = "festival" | "solar-term" | "custom"

export type MonthDay = {
  id: string
  name: string
  kind: MonthDayKind
  date: CalendarDate
  /** 명절 화면으로 이어지는 날. 명절 자신과 복날(삼복)이다. */
  festival?: Festival
}

/** 고른 절기. longitude는 태양 황경(도). 동지는 명절에 있어 뺀다. */
const SOLAR_TERMS = [
  { id: "sohan", name: "소한", longitude: 285 },
  { id: "daehan", name: "대한", longitude: 300 },
  { id: "ipchun", name: "입춘", longitude: 315 },
  { id: "gyeongchip", name: "경칩", longitude: 345 },
  { id: "chunbun", name: "춘분", longitude: 0 },
  { id: "ipha", name: "입하", longitude: 45 },
  { id: "haji", name: "하지", longitude: 90 },
  { id: "ipchu", name: "입추", longitude: 135 },
  { id: "cheoseo", name: "처서", longitude: 150 },
  { id: "chubun", name: "추분", longitude: 180 },
  { id: "ipdong", name: "입동", longitude: 225 },
] as const

export type MonthDayId = (typeof SOLAR_TERMS)[number]["id"] | "hansik" | "dano" | "chilseok" | "chobok" | "jungbok" | "malbok" | Festival

const DAY_MS = 86_400_000

const toTime = ({ year, month, day }: CalendarDate) => Date.UTC(year, month - 1, day)
const fromTime = (time: number): CalendarDate => {
  const date = new Date(time)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

/** 그날이 경일(庚日)인지. 일진의 천간은 율리우스 일수를 10으로 나눈 나머지로 정해지고, 나머지 7이 경(庚)이다. */
function isGyeongDay(time: number): boolean {
  const julianDay = Math.round(time / DAY_MS) + 2440588
  return julianDay % 10 === 7
}

/** from부터(그날 포함) n번째 경일. */
function nthGyeongDay(from: CalendarDate, n: number): CalendarDate {
  let time = toTime(from)
  for (let found = 0; ; time += DAY_MS) {
    if (isGyeongDay(time) && ++found === n) return fromTime(time)
  }
}

function lunarDay(id: "dano" | "chilseok", name: string, year: number, month: number, day: number): MonthDay[] {
  const date = lunarToSolar(year, month, day)
  return date ? [{ id, name, kind: "custom", date }] : []
}

function computeYear(year: number): readonly MonthDay[] {
  const terms: MonthDay[] = SOLAR_TERMS.map((term) => ({
    id: term.id,
    name: term.name,
    kind: "solar-term",
    date: solarTermDate(year, term.longitude),
  }))
  const haji = solarTermDate(year, 90)
  const ipchu = solarTermDate(year, 135)
  const customs: MonthDay[] = [
    { id: "hansik", name: "한식", kind: "custom", date: fromTime(toTime(winterSolstice(year - 1)) + 105 * DAY_MS) },
    ...lunarDay("dano", "단오", year, 5, 5),
    ...lunarDay("chilseok", "칠석", year, 7, 7),
    { id: "chobok", name: "초복", kind: "custom", date: nthGyeongDay(haji, 3), festival: "sambok" },
    { id: "jungbok", name: "중복", kind: "custom", date: nthGyeongDay(haji, 4), festival: "sambok" },
    { id: "malbok", name: "말복", kind: "custom", date: nthGyeongDay(ipchu, 1), festival: "sambok" },
  ]
  // 날짜가 없는 명절(삼복)은 복날 세 줄이 대신한다.
  const festivals = FESTIVALS.flatMap((festival): MonthDay[] => {
    const date = festivalDate(festival.slug, year)
    return date ? [{ id: festival.slug, name: festival.name, kind: "festival", date, festival: festival.slug }] : []
  })
  return [...festivals, ...terms, ...customs].sort((a, b) => toTime(a.date) - toTime(b.date))
}

// 음력 변환이 하루씩 세어 보는 계산이라, 한 요청에서 열두 달을 그려도 해마다 한 번만 계산한다.
const byYear = new Map<number, readonly MonthDay[]>()
function daysOfYear(year: number): readonly MonthDay[] {
  let days = byYear.get(year)
  if (!days) byYear.set(year, (days = computeYear(year)))
  return days
}

/** 그해 그 달(1~12)의 명절·절기·세시. 날짜 순이다. */
export function monthDays(month: number, year: number): readonly MonthDay[] {
  return daysOfYear(year).filter((day) => day.date.month === month)
}

/** 그 달이 끝난 뒤 처음 오는 날. 그해에 없으면 다음 해에서 찾는다. 빈 달의 안내에 쓴다. */
export function nextMonthDay(month: number, year: number): MonthDay | undefined {
  return daysOfYear(year).find((day) => day.date.month > month) ?? daysOfYear(year + 1)[0]
}
