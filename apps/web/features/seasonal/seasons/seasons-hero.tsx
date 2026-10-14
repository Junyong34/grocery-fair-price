import Link from "next/link"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { SEASONS } from "@workspace/seasonal/data/seasons"

import { routes } from "@/shared/routes"

import { NowTag } from "./now-tag"
import { SeasonBackground } from "./season-background"
import { SeasonCard } from "./season-card"
import { SeasonCarousel } from "./season-carousel"
import { SEASON_BACKGROUND } from "./season-style"

/**
 * 3a 네 계절 히어로(명세 3.3 ①). 카드 전체가 계절 상세로 가는 링크다.
 * 모바일은 한 장씩 캐러셀(첫 화면은 지금 계절), 데스크톱은 4장 한 줄에 마우스를 올린 장이 넓어진다.
 */
export function SeasonsHero() {
  return (
    <div className="mx-auto max-w-[1080px] pt-4 lg:px-6 lg:pt-8">
      <h1 className="sr-only">네 계절</h1>
      <SeasonCarousel>
        {SEASONS.map((season) => (
          <Link
            key={season}
            href={routes.seasonal.season(season)}
            aria-label={`${SEASON_COPY[season].name} 제철 보기`}
            className="group/card h-[min(540px,calc(100svh-240px))] min-h-[420px] w-[calc(100%-24px)] shrink-0 snap-center text-ink no-underline transition-[flex-grow] duration-350 ease-out hover:text-ink lg:h-[min(640px,calc(100svh-200px))] lg:w-auto lg:min-w-0 lg:flex-1 lg:hover:flex-[1.7]"
          >
            <SeasonCard
              season={season}
              nowTag={<NowTag season={season} />}
              background={
                <SeasonBackground season={season} variant={SEASON_BACKGROUND} />
              }
              className="transition-colors duration-350 lg:group-hover/card:bg-surface/60"
            />
          </Link>
        ))}
      </SeasonCarousel>
    </div>
  )
}
