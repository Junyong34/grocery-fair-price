import { ViewTransition } from "react"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { foodsInSeason, seasonHighlights } from "@workspace/seasonal/data/foods"
import { SEASON_MONTHS, type Season } from "@workspace/seasonal/data/seasons"
import { cn } from "@workspace/ui/lib/utils"

import { FoodImage } from "../components/food-image"
import { SEASON_COLOR_VAR } from "./season-style"

/** 대표 품종 4개를 겹쳐 놓는 자리(카드 그림 영역 대비 %, 기울기). 뒤 → 앞 순서. */
const COLLAGE = [
  { left: 4, top: 6, size: 46, rotate: -8 },
  { left: 50, top: 0, size: 44, rotate: 7 },
  { left: 26, top: 34, size: 50, rotate: 2 },
  { left: 58, top: 44, size: 40, rotate: -5 },
] as const

/**
 * 계절명. 카드와 계절 상세가 같은 이름으로 감싸 이어지는 전환(공유 요소)을 만든다.
 * 한 화면에 같은 계절이 둘 이상 있으면(비교 페이지) 이름이 겹쳐 오류가 나므로 shared={false}로 끈다.
 */
export function SeasonTitle({
  season,
  shared = true,
  className,
}: {
  season: Season
  shared?: boolean
  className?: string
}) {
  const title = (
    <span
      className={cn("block font-heading leading-none font-bold", className)}
    >
      {SEASON_COPY[season].name}
    </span>
  )
  if (!shared) return title
  return (
    <ViewTransition name={`season-title-${season}`} share="auto" default="none">
      {title}
    </ViewTransition>
  )
}

/**
 * 3a 계절 카드 본문(명세 3.3). 배경(background)과 "지금 계절" 표시(nowTag)는 쓰는 쪽이 넣는다.
 * 카드 전체를 링크로 감싸는 것도 쓰는 쪽이 정한다.
 * 카드 폭(@container)에 맞춰 글자·여백이 줄고, 좁은 폰(<400px)에서는 글은 왼쪽·그림은 오른쪽인 가로 카드가 된다.
 */
export function SeasonCard({
  season,
  background,
  nowTag,
  sharedTitle = true,
  className,
}: {
  season: Season
  background: React.ReactNode
  nowTag?: React.ReactNode
  /** 계절명 공유 전환을 쓸지. 같은 계절 카드가 여럿 있는 화면에서는 false. */
  sharedTitle?: boolean
  className?: string
}) {
  const copy = SEASON_COPY[season]
  const highlights = seasonHighlights(season, 4)
  return (
    // @container: 2열 모바일이나 데스크톱에서 다른 카드가 넓어지면 이 카드는 좁아진다. 좁을 때는 설명·이름을 숨긴다.
    <div
      className={cn(
        "@container relative isolate h-full overflow-hidden rounded-lg border border-hairline",
        className
      )}
    >
      {background}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: SEASON_COLOR_VAR[season] }}
      />
      <div
        className={cn(
          "grid h-full grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] p-3.5 [grid-template-areas:'meta'_'title'_'desc'_'art'_'foot'] @[260px]:p-5",
          "max-[399px]:grid-cols-[minmax(0,1fr)_44%] max-[399px]:grid-rows-[auto_minmax(0,1fr)_auto] max-[399px]:gap-x-2 max-[399px]:px-4 max-[399px]:py-3.5 max-[399px]:[grid-template-areas:'meta_meta'_'title_.'_'foot_.']"
        )}
      >
        <div className="flex items-center justify-between gap-2 text-[11px] tracking-[.08em] text-stone [grid-area:meta] @[260px]:text-xs">
          <span className="truncate">
            {copy.english} · {SEASON_MONTHS[season].join(" · ")}월
          </span>
          {nowTag}
        </div>
        <SeasonTitle
          season={season}
          shared={sharedTitle}
          className="mt-2 text-[clamp(34px,22cqi,72px)] [grid-area:title] @[260px]:mt-3 max-[399px]:self-center max-[399px]:text-[40px]"
        />
        <p className="mt-2 hidden font-heading text-[15px] text-stone [grid-area:desc] @[220px]:block max-[399px]:hidden!">
          {copy.description}
        </p>

        <div
          aria-hidden
          className="relative my-3 min-h-0 [grid-area:art] @[260px]:my-4 max-[399px]:absolute max-[399px]:[grid-area:auto] max-[399px]:top-6 max-[399px]:right-0 max-[399px]:bottom-0 max-[399px]:my-0 max-[399px]:w-[40%]"
        >
          <div className="absolute inset-0 m-auto aspect-square max-h-full max-w-full">
            {highlights.map((food, i) => {
              const spot = COLLAGE[i]!
              return (
                <span
                  key={food.id}
                  className="absolute block drop-shadow-sm"
                  style={{
                    left: `${spot.left}%`,
                    top: `${spot.top}%`,
                    width: `${spot.size}%`,
                    rotate: `${spot.rotate}deg`,
                  }}
                >
                  <FoodImage food={food} sizes="200px" showName />
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 [grid-area:foot]">
          <span className="min-w-0 text-xs whitespace-nowrap text-stone">
            <span className="hidden truncate whitespace-normal @[300px]:block max-[399px]:hidden!">
              {highlights
                .slice(0, 3)
                .map((food) => food.name)
                .join(" · ")}
            </span>
            {foodsInSeason(season).length}가지
            <span className="min-[400px]:hidden"> 제철 보기 →</span>
          </span>
          {/* 좁은 가로 카드에서는 버튼 없이 개수 옆 화살표만 둔다(카드 전체가 링크다). */}
          <span className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-sm text-canvas @[260px]:px-4 @[260px]:py-2 max-[399px]:hidden">
            <span className="hidden @[260px]:inline max-[399px]:hidden!">
              {copy.name} 제철 보기{" "}
            </span>
            →
          </span>
        </div>
      </div>
    </div>
  )
}
