import type { Month } from "@workspace/seasonal/data/months"
import { seasonOfMonth, type Season } from "@workspace/seasonal/data/seasons"
import type { PrintSpec } from "@workspace/seasonal/print/spec"

/** 용지 단위 길이(A4 기준 mm). A3에서는 CSS의 --u가 √2배가 된다. */
export const u = (n: number) => `calc(var(--u) * ${n})`

/** 글자 크기. 사양의 글자 배율(--t)을 곱한다. */
export const t = (n: number) => `calc(var(--u) * ${n} * var(--t))`

const SURFACE = {
  cream: "var(--color-canvas)",
  white: "var(--color-surface)",
} as const

/** 시트·칸 바탕. season은 계절색을 옅게 섞는다. */
export function surfaceColor(surface: PrintSpec["surface"], season?: Season): string {
  if (surface !== "season") return SURFACE[surface]
  if (!season) return SURFACE.white
  return `color-mix(in oklab, var(--color-season-${season}) 14%, var(--color-canvas))`
}

export const monthSeason = (month: Month) => seasonOfMonth(month)
