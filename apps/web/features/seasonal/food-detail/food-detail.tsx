import Link from "next/link"

import { INFANT_PAIRING_COPY, UI_COPY } from "@workspace/seasonal/data/copy"
import { festivalsWithFood } from "@workspace/seasonal/data/festivals"
import { foodsInSeasonWith, seasonsOf, type Food } from "@workspace/seasonal/data/foods"
import { findPairing } from "@workspace/seasonal/data/infant-pairings"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"
import { ScrollRow } from "@workspace/ui/components/scroll-row"

import { routes } from "@/shared/routes"

import { FoodImage } from "../components/food-image"
import { SeasonMonthsBar } from "../components/season-months-bar"
import { SeasonTag } from "../components/season-tag"
import { EatToggle } from "./eat-toggle"
import { FestivalLink } from "./festival-link"

/** 같은 때 제철 목록에 보일 개수 */
const SAME_SEASON_LIMIT = 12

/**
 * 1i 품종 상세 본문(spec "화면별"). 하단 시트, 데스크톱 오른쪽 패널, 전체 페이지가 같은 본문을 쓴다.
 * 제목(품종명)은 껍데기가 그린다. 시트·패널은 접근성 제목으로, 전체 페이지는 h1로 쓴다.
 */
export function FoodDetail({
  food,
  title,
  priceHref,
}: {
  food: Food
  title?: React.ReactNode
  /** 같은 품종의 시세 화면 주소. 아직 시세 데이터가 없는 품종이면 비워 시세 메인(/) 링크를 보인다. */
  priceHref?: string | null
}) {
  const seasons = seasonsOf(food)
  const festivals = festivalsWithFood(food.id)
  const sameSeason = foodsInSeasonWith(food).slice(0, SAME_SEASON_LIMIT)

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-[240px]">
        <FoodImage food={food} variant="motion" preload />
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
            className="grid grid-cols-12 text-center text-[11px] text-caption tabular-nums"
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
                <FestivalLink
                  href={routes.seasonal.festival(festival.slug)}
                  name={festival.name}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-caption">{UI_COPY.noRelatedFestival}</p>
        )}
      </section>

      {sameSeason.length > 0 && (
        <section aria-labelledby="same-season" className="flex flex-col gap-2">
          <h3 id="same-season" className="text-sm font-semibold text-stone">
            같은 때 제철
          </h3>
          {/* 시트 본문은 overflow-y-auto라 가로로도 스크롤된다. 음수 여백을 주면 그만큼 본문 전체가 옆으로 움직이니 쓰지 않는다. */}
          <ScrollRow role="list" className="snap-x gap-3 pb-2">
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
                  <FoodImage food={other} showName={false} />
                  <span className="w-full truncate">{other.name}</span>
                </Link>
              </div>
            ))}
          </ScrollRow>
        </section>
      )}

      {priceHref ? (
        <Link
          href={priceHref}
          className="rounded-md border border-ink py-3 text-center text-sm font-semibold text-ink no-underline hover:text-ink"
        >
          {UI_COPY.priceLink(food.name)}
        </Link>
      ) : (
        <Link
          href={routes.home}
          className="flex items-center justify-between gap-3 rounded-md border border-hairline px-4 py-3 text-ink no-underline hover:text-ink"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{UI_COPY.priceHubLink}</span>
            <span className="text-xs text-caption">{UI_COPY.priceUnavailable(food.name)}</span>
          </span>
          <span aria-hidden className="text-stone">›</span>
        </Link>
      )}

      {/* 이유식 궁합표에 이 품종의 표가 있으면 재료별 궁합 페이지로 보낸다(baby-food-ingredient-pages/03). */}
      {findPairing(food.id) && (
        <Link
          href={routes.babyFood.ingredient(food.id)}
          className="flex items-center justify-between gap-3 rounded-md border border-hairline px-4 py-3 text-sm font-semibold text-ink no-underline hover:text-ink"
        >
          {INFANT_PAIRING_COPY.foodLink}
          <span aria-hidden className="text-stone">›</span>
        </Link>
      )}
    </div>
  )
}
