import Link from "next/link"

import { UI_COPY } from "@workspace/seasonal/data/copy"
import { festivalsWithFood } from "@workspace/seasonal/data/festivals"
import { foodsInSeasonWith, type Food } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"
import { SEASONS, SEASON_MONTHS } from "@workspace/seasonal/data/seasons"
import { HeroButton } from "@workspace/ui/components/hero-button"
import { ScrollRow } from "@workspace/ui/components/scroll-row"

import { routes } from "@/shared/routes"

import { FoodImage } from "../components/food-image"
import { SeasonMonthsBar } from "../components/season-months-bar"
import { SeasonTag } from "../components/season-tag"
import { EatToggle } from "./eat-toggle"

/** 같은 때 제철 목록에 보일 개수 */
const SAME_SEASON_LIMIT = 12

/**
 * 1i 품종 상세 본문(spec "화면별"). 하단 시트, 데스크톱 오른쪽 패널, 전체 페이지가 같은 본문을 쓴다.
 * 제목(품종명)은 껍데기가 그린다. 시트·패널은 접근성 제목으로, 전체 페이지는 h1로 쓴다.
 */
export function FoodDetail({
  food,
  title,
}: {
  food: Food
  title?: React.ReactNode
}) {
  const seasons = SEASONS.filter((season) =>
    food.months.some((month) => SEASON_MONTHS[season].includes(month))
  )
  const festivals = festivalsWithFood(food.id)
  const sameSeason = foodsInSeasonWith(food).slice(0, SAME_SEASON_LIMIT)

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-[240px]">
        <FoodImage food={food} variant="motion" sizes="240px" preload />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {title}
          {seasons.map((season) => (
            <SeasonTag key={season} season={season} />
          ))}
        </div>
        {food.aliases.length > 0 && (
          <p className="text-sm text-stone">
            다른 이름 {food.aliases.join(", ")}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <SeasonMonthsBar months={food.months} className="[&>span]:h-1.5" />
          <div
            aria-hidden
            className="grid grid-cols-12 text-center text-[10px] text-ash tabular-nums"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <p className="text-sm text-stone">
            {formatSeasonMonths(food.months)}
          </p>
        </div>
      </div>

      <EatToggle foodId={food.id} />

      <section
        aria-labelledby="related-festivals"
        className="flex flex-col gap-2"
      >
        <h3 id="related-festivals" className="text-sm font-semibold text-stone">
          관련 명절
        </h3>
        {festivals.length ? (
          <ul className="flex flex-wrap gap-2">
            {festivals.map((festival) => (
              <li key={festival.slug}>
                {/* cojeev hero-button 종이 접힘(paper-fold): 달력 한 장을 넘기듯 귀퉁이가 접힌 gold 카드. 비교는 /examples/festival-buttons */}
                <HeroButton asChild appearance="paper-fold" size="sm">
                  <Link
                    href={routes.seasonal.festival(festival.slug)}
                    className="no-underline"
                  >
                    {festival.name}
                  </Link>
                </HeroButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ash">{UI_COPY.noRelatedFestival}</p>
        )}
      </section>

      {sameSeason.length > 0 && (
        <section aria-labelledby="same-season" className="flex flex-col gap-2">
          <h3 id="same-season" className="text-sm font-semibold text-stone">
            같은 때 제철
          </h3>
          <ScrollRow
            role="list"
            frameClassName="-mx-1"
            className="snap-x gap-3 px-1 pb-2"
          >
            {sameSeason.map((other) => (
              <div
                role="listitem"
                key={other.id}
                className="w-[72px] shrink-0 snap-start"
              >
                <Link
                  href={routes.seasonal.food(other.id)}
                  replace
                  scroll={false}
                  className="flex flex-col items-center gap-1 text-center text-xs text-ink no-underline hover:text-ink"
                >
                  <FoodImage food={other} sizes="72px" showName={false} />
                  <span className="w-full truncate">{other.name}</span>
                </Link>
              </div>
            ))}
          </ScrollRow>
        </section>
      )}

      <button
        type="button"
        disabled
        className="rounded-md border border-hairline py-3 text-sm text-ash"
        aria-describedby="price-coming-soon"
      >
        {UI_COPY.priceComingSoon}
        <span id="price-coming-soon" className="sr-only">
          가격 비교 기능이 생기면 열립니다
        </span>
      </button>
    </div>
  )
}
