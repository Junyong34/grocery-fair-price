"use client"

import { useEatenIds } from "@/shared/eaten-store"

/** 그해 먹은 품종 수. 기록은 기기에 있어 하이드레이션 전에는 0이다. */
export function EatenCount({ year }: { year: number }) {
  return useEatenIds(year).size
}
