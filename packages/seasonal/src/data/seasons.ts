import { orderSeasonMonths } from "./months"

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const
export type Season = (typeof SEASONS)[number]

/** 계절마다 속한 달. 겨울은 해를 넘어 12·1·2월이다. */
export const SEASON_MONTHS: Record<Season, readonly number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
}

export function isSeason(value: string): value is Season {
  return SEASONS.some((season) => season === value)
}

/** 달(1~12)이 속한 계절. */
export function seasonOfMonth(month: number): Season {
  return SEASONS.find((season) => SEASON_MONTHS[season].includes(month))!
}

/** 제철이 시작하는 달의 계절. 해를 넘는 제철은 계절 순서로 첫 달을 본다(딸기 12~4월은 겨울). 막대표 색과 계절 포스터가 쓴다. */
export function startSeason(months: readonly number[]): Season {
  return seasonOfMonth(orderSeasonMonths(months)[0]!)
}
