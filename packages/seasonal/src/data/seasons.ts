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
