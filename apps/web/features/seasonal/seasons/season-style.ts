import type { Season } from "@workspace/seasonal/data/seasons"

/** 계절색 토큰. 인라인 style에서 쓴다. */
export const SEASON_COLOR_VAR: Record<Season, string> = {
  spring: "var(--color-season-spring)",
  summer: "var(--color-season-summer)",
  autumn: "var(--color-season-autumn)",
  winter: "var(--color-season-winter)",
}
