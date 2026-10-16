import { Leaf, Snowflake, Sprout, Sun, type LucideIcon } from "lucide-react"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import type { Season } from "@workspace/seasonal/data/seasons"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 작은 글자·아이콘용 계절색.
 * 봄(sage)·가을(gold)은 밝아 작은 글자로는 바탕 대비가 모자라서 ink를 섞어 4.5:1을 넘긴다(봄 65%, 가을 75%).
 */
export const SEASON_TEXT_CLASS: Record<Season, string> = {
  spring:
    "text-[color-mix(in_oklab,var(--color-season-spring)_65%,var(--color-ink))]",
  summer: "text-season-summer",
  autumn:
    "text-[color-mix(in_oklab,var(--color-season-autumn)_75%,var(--color-ink))]",
  winter: "text-season-winter",
}

/** 글자는 계절색, 테두리는 계절색을 옅게. */
const SEASON_CLASS: Record<Season, string> = {
  spring: cn(SEASON_TEXT_CLASS.spring, "border-season-spring/45"),
  summer: cn(SEASON_TEXT_CLASS.summer, "border-season-summer/35"),
  autumn: cn(SEASON_TEXT_CLASS.autumn, "border-season-autumn/45"),
  winter: cn(SEASON_TEXT_CLASS.winter, "border-season-winter/35"),
}

export const SEASON_ICON: Record<Season, LucideIcon> = {
  spring: Sprout,
  summer: Sun,
  autumn: Leaf,
  winter: Snowflake,
}

/** 계절 태그(명세 2.4). 계절 아이콘(새싹·해·잎·눈송이)과 계절색 글자의 알약. 시안 비교 페이지 season-tags는 2026-10-16에 지웠다(`git show 22520eb:apps/web/app/examples/season-tags/page.tsx`) */
export function SeasonTag({
  season,
  className,
}: {
  season: Season
  className?: string
}) {
  const Icon = SEASON_ICON[season]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs leading-none font-semibold",
        SEASON_CLASS[season],
        className
      )}
    >
      <Icon aria-hidden size={13} strokeWidth={2} />
      {SEASON_COPY[season].name}
    </span>
  )
}
