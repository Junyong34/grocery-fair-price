"use client"

import { PatternBackground } from "@workspace/ui/components/pattern-background"
import type { Season } from "@workspace/seasonal/data/seasons"

import { SEASON_COLOR_VAR } from "./season-style"

/**
 * 계절을 표현하는 카드 배경. cojeev pattern-background의 sunwash(넓고 옅은 색 웅덩이)를 계절색으로 칠하고,
 * 아래에서 위로 계절색이 옅게 번지는 바탕을 깐다.
 * 2026-10-14 비교 페이지 season-backgrounds에서 sprouts·contours·pigment-field·plain과 비교해 골랐다
 * (페이지는 2026-10-16에 지웠다. `git show 22520eb:apps/web/app/examples/season-backgrounds/page.tsx`).
 */
export function SeasonBackground({ season }: { season: Season }) {
  const color = SEASON_COLOR_VAR[season]
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(to top, color-mix(in oklab, ${color} 22%, transparent), transparent 70%)`,
        }}
      />
      <PatternBackground variant="sunwash" color={color} opacity={0.45} spacing={28} />
    </>
  )
}
