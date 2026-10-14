"use client"

import { PatternBackground } from "@workspace/ui/components/pattern-background"
import { PigmentField } from "@workspace/ui/components/pigment-field"
import type { Season } from "@workspace/seasonal/data/seasons"

import { SEASON_COLOR_VAR, type SeasonBackgroundVariant } from "./season-style"

/**
 * 계절을 표현하는 카드 배경. 모두 계절색 토큰으로 칠한다.
 * pigment(WebGL)는 active가 false면 멈춘다. 모바일 캐러셀에서 보이는 카드만 움직이게 할 때 쓴다.
 */
export function SeasonBackground({
  season,
  variant,
  active = true,
}: {
  season: Season
  variant: SeasonBackgroundVariant
  active?: boolean
}) {
  const color = SEASON_COLOR_VAR[season]
  // 아래에서 위로 계절색이 옅게 번지는 바탕. 모든 후보에 깔아 카드 색을 맞춘다.
  const wash = (
    <span
      aria-hidden
      className="absolute inset-0 -z-10"
      style={{
        background: `linear-gradient(to top, color-mix(in oklab, ${color} 22%, transparent), transparent 70%)`,
      }}
    />
  )
  switch (variant) {
    case "pigment":
      return (
        <PigmentField
          paused={!active}
          intensity={0.7}
          className="-z-10"
          // 셰이더는 --v-paper와 --v-pink·--v-blue·--v-yellow(balanced 톤)를 읽는다. 이 카드 안에서만 계절색으로 바꾼다.
          // CSS 대체 그림(WebGL이 없을 때)은 --field-a·b·c를 읽는다.
          style={
            {
              "--v-paper": "var(--color-canvas)",
              "--v-pink": `color-mix(in srgb, ${color} 55%, var(--color-canvas))`,
              "--v-blue": `color-mix(in srgb, ${color} 30%, var(--color-canvas))`,
              "--v-yellow": "var(--color-gold-pale)",
              "--field-a": `color-mix(in srgb, ${color} 55%, var(--color-canvas))`,
              "--field-b": `color-mix(in srgb, ${color} 30%, var(--color-canvas))`,
              "--field-c": "var(--color-gold-pale)",
            } as React.CSSProperties
          }
        />
      )
    case "plain":
      return wash
    default:
      return (
        <>
          {wash}
          <PatternBackground
            variant={variant}
            color={color}
            opacity={variant === "sunwash" ? 0.45 : 0.3}
            spacing={variant === "sunwash" ? 28 : 22}
          />
        </>
      )
  }
}
