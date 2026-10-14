export const SEASONS = ["spring", "summer", "autumn", "winter"] as const
export type Season = (typeof SEASONS)[number]

export function isSeason(value: string): value is Season {
  return SEASONS.some((season) => season === value)
}
