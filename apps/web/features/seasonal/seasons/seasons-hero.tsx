import Link from "next/link"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { SEASONS } from "@workspace/seasonal/data/seasons"

import { routes } from "@/shared/routes"

import { NowTag } from "./now-tag"
import { SeasonBackground } from "./season-background"
import { SeasonCard } from "./season-card"
import { SEASON_BACKGROUND } from "./season-style"

/**
 * 3a 네 계절 히어로(명세 3.3 ①). 카드 전체가 계절 상세로 가는 링크다. 네 장이 한 화면을 채운다(cojeev bento-grid의 둥근 카드 격자를 참고).
 * 좁은 폰(<400px)은 가로로 긴 카드 4줄, 그보다 넓으면 2열 2줄, 데스크톱은 4장 한 줄에 마우스를 올린 장이 넓어진다.
 */
export function SeasonsHero() {
  return (
    <div className="mx-auto max-w-[1080px] pt-4 lg:px-6 lg:pt-8">
      <h1 className="sr-only">네 계절</h1>
      <div className="grid grid-cols-1 gap-3 px-[18px] min-[400px]:grid-cols-2 lg:flex lg:px-0">
        {SEASONS.map((season) => (
          <Link
            key={season}
            href={routes.seasonal.season(season)}
            aria-label={`${SEASON_COPY[season].name} 제철 보기`}
            className="group/card h-[max(140px,calc((100svh-300px)/4))] text-ink min-[400px]:h-[max(250px,calc((100svh-276px)/2))] no-underline transition-[flex-grow] duration-350 ease-out hover:text-ink lg:h-[min(640px,calc(100svh-200px))] lg:min-w-0 lg:flex-1 lg:hover:flex-[1.7]"
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
      </div>
    </div>
  )
}
