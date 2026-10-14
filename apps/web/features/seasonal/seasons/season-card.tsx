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
    // @container: 데스크톱에서 다른 카드가 넓어지면 이 카드는 좁아진다. 좁을 때는 대표 품종 이름을 숨긴다.
    <div
      className={cn(
        "@container relative isolate flex h-full flex-col overflow-hidden rounded-lg border border-hairline p-5",
        className
      )}
    >
      {background}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: SEASON_COLOR_VAR[season] }}
      />
      <div className="flex items-center justify-between gap-2 text-xs tracking-[.08em] text-stone">
        <span className="truncate">
          {copy.english} · {SEASON_MONTHS[season].join(" · ")}월
        </span>
        {nowTag}
      </div>
      <SeasonTitle
        season={season}
        shared={sharedTitle}
        className="mt-3 text-[64px] lg:text-[72px]"
      />
      <p className="mt-2 font-heading text-[15px] text-stone">
        {copy.description}
      </p>

      <div aria-hidden className="relative my-4 min-h-0 flex-1">
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

      <div className="flex items-end justify-between gap-3">
        <span className="min-w-0 text-xs whitespace-nowrap text-stone">
          <span className="hidden truncate whitespace-normal @[300px]:block">
            {highlights
              .slice(0, 3)
              .map((food) => food.name)
              .join(" · ")}
          </span>
          {foodsInSeason(season).length}가지
        </span>
        <span className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm text-canvas">
          {copy.name} 제철 보기 →
        </span>
      </div>
    </div>
  )
}
