"use client"

import type { Festival } from "@workspace/seasonal/data/festivals"
import { PatternBackground } from "@workspace/ui/components/pattern-background"
import { Shape } from "@workspace/ui/components/shape"
import { cn } from "@workspace/ui/lib/utils"

import { FESTIVAL_STYLE } from "./festival-style"

/**
 * 명절 카드 배경. 명절 테마 색 그라데이션 + cojeev PatternBackground + Shape 워터마크를 겹친다.
 * Card(.v-card > :not(.v-wm))가 직계 자식을 relative로 덮어쓰지 않도록 절대 위치 레이어로 감싼다.
 */
export function FestivalBackground({
  slug,
  compact = false,
  active = false,
}: {
  slug: Festival
  compact?: boolean
  active?: boolean
}) {
  const style = FESTIVAL_STYLE[slug]
  const washStrength = compact ? (active ? "22%" : "10%") : "18%"
  const patternOpacity = compact
    ? active
      ? style.patternOpacity * 0.85
      : style.patternOpacity * 0.45
    : style.patternOpacity

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute! inset-0 -z-10 overflow-hidden rounded-[inherit]"
    >
      <span
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklab, ${style.color} ${washStrength}, transparent), transparent 72%)`,
        }}
      />
      <PatternBackground
        variant={style.pattern}
        color={style.color}
        opacity={patternOpacity}
        spacing={compact ? Math.max(16, Math.round(style.patternSpacing * 0.75)) : style.patternSpacing}
      />
      <Shape
        name={style.shape}
        className={cn(
          "pointer-events-none absolute aspect-square h-auto!",
          compact
            ? "-top-3 -right-3 w-14 opacity-15"
            : "-top-8 -right-6 w-36 opacity-16 sm:w-44"
        )}
        style={{ "--c": style.color } as React.CSSProperties}
      />
    </div>
  )
}
