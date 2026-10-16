import type { Season } from "@workspace/seasonal/data/seasons"

/** 3a 계절 카드 배경 후보. 비교 페이지 season-backgrounds(2026-10-16 지움)에서 sunwash로 정했다. 화면은 SEASON_BACKGROUND 하나만 쓴다. */
export const SEASON_BACKGROUNDS = [
  "sunwash",
  "sprouts",
  "contours",
  "pigment",
  "plain",
] as const
export type SeasonBackgroundVariant = (typeof SEASON_BACKGROUNDS)[number]

/** 계절색 토큰. 인라인 style에서 쓴다. */
export const SEASON_COLOR_VAR: Record<Season, string> = {
  spring: "var(--color-season-spring)",
  summer: "var(--color-season-summer)",
  autumn: "var(--color-season-autumn)",
  winter: "var(--color-season-winter)",
}

/** 실제 3a 화면이 쓰는 배경. 2026-10-14 비교 페이지에서 사용자가 sunwash를 골랐다. */
export const SEASON_BACKGROUND: SeasonBackgroundVariant = "sunwash"
