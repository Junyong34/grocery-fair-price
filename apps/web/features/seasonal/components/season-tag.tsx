import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import type { Season } from "@workspace/seasonal/data/seasons"
import { cn } from "@workspace/ui/lib/utils"

const SEASON_COLOR: Record<Season, string> = {
  spring: "shadow-[inset_0_-3px_0_var(--color-season-spring)]",
  summer: "shadow-[inset_0_-3px_0_var(--color-season-summer)]",
  autumn: "shadow-[inset_0_-3px_0_var(--color-season-autumn)]",
  winter: "shadow-[inset_0_-3px_0_var(--color-season-winter)]",
}

/** 계절 태그(명세 2.4). 아래 3px 띠가 계절색이다. */
export function SeasonTag({ season, className }: { season: Season; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-[3px] border border-ink px-2.5 py-[3px] text-xs leading-none tracking-[.1em] text-ink",
        SEASON_COLOR[season],
        className,
      )}
    >
      {SEASON_COPY[season].name}
    </span>
  )
}
