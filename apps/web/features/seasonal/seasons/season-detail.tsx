import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { ViewTransition } from "react"

import { MONTH_NOTES, SEASON_COPY } from "@workspace/seasonal/data/copy"
import { foodsInMonth, foodsInSeason } from "@workspace/seasonal/data/foods"
import type { Month } from "@workspace/seasonal/data/months"
import {
  SEASONS,
  SEASON_MONTHS,
  type Season,
} from "@workspace/seasonal/data/seasons"

import { routes } from "@/shared/routes"
import { BackButton } from "@/shared/shell/sub-header"

import { EatenBadgeToday } from "../components/eaten-badge"
import { FoodImage } from "../components/food-image"
import { ShareButton } from "../components/share-button"
import { SeasonTitle } from "./season-card"
import { SEASON_COLOR_VAR } from "./season-style"

const step = (season: Season, by: 1 | -1) =>
  SEASONS[(SEASONS.indexOf(season) + by + SEASONS.length) % SEASONS.length]!

/**
 * 3a 계절 상세(명세 3.3 ②). 계절에 속한 달마다 그 달 제철 품종을 묶어 보인다.
 * 카드에서 들어오면 계절명이 이어지고(공유 요소), 이전/다음 계절은 옆으로 미끄러진다.
 */
export function SeasonDetail({ season }: { season: Season }) {
  const copy = SEASON_COPY[season]
  const months = SEASON_MONTHS[season] as readonly Month[]
  const total = foodsInSeason(season).length
  const previous = step(season, -1)
  const next = step(season, 1)

  return (
    <ViewTransition
      key={season}
      enter={{
        "season-next": "season-next",
        "season-prev": "season-prev",
        default: "none",
      }}
      exit={{
        "season-next": "season-next",
        "season-prev": "season-prev",
        default: "none",
      }}
      default="none"
    >
      <div className="mx-auto max-w-[1080px] px-[18px] pb-8 lg:px-6">
        <div className="sticky top-[calc(var(--shell-top)+var(--tabs-h))] z-[2] flex h-14 items-center gap-2 border-b border-hairline bg-canvas">
          <BackButton fallbackHref={routes.seasonal.seasons} />
          <span className="shrink-0 font-heading text-lg font-bold">
            {copy.name}
          </span>
          <nav
            aria-label={`${copy.name} 월별 제철로 이동`}
            className="ml-auto flex items-center"
          >
            {months.map((month) => (
              <a
                key={month}
                href={`#season-month-${month}`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm text-stone no-underline hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-ring"
              >
                {month}월
              </a>
            ))}
          </nav>
          <ShareButton className="shrink-0" />
        </div>
        <div className="pt-5 lg:grid lg:grid-cols-[300px_1fr] lg:gap-10 lg:pt-8">
          <aside className="flex flex-col gap-3 lg:sticky lg:top-[calc(var(--shell-top)+var(--tabs-h)+72px)] lg:self-start">
            <span
              aria-hidden
              className="h-[3px] w-12"
              style={{ background: SEASON_COLOR_VAR[season] }}
            />
            <p className="text-xs tracking-[.08em] text-stone">
              {copy.english} · {months.join("·")}월 · {total}가지
            </p>
            <h1>
              <SeasonTitle
                season={season}
                className="text-[60px] lg:text-[104px]"
              />
            </h1>
            <p className="font-heading text-[17px] text-stone">
              {copy.description}
            </p>
            <p className="hidden text-sm text-stone lg:block">
              {total}가지의 제철음식
            </p>
          </aside>

          <div className="mt-6 flex flex-col gap-10 lg:mt-0">
            {months.map((month) => {
              const foods = foodsInMonth(month)
              return (
                <section
                  key={month}
                  id={`season-month-${month}`}
                  aria-labelledby={`season-month-${month}-title`}
                  className="scroll-mt-[calc(var(--shell-top)+var(--tabs-h)+72px)]"
                >
                  <div className="flex items-baseline justify-between gap-3 border-b border-hairline pb-2">
                    <h2
                      id={`season-month-${month}-title`}
                      className="flex items-baseline gap-3"
                    >
                      <span className="font-number text-[28px] leading-none tabular-nums lg:text-[44px]">
                        {month}월
                      </span>
                      <span className="font-heading text-[15px] text-stone lg:text-lg">
                        {MONTH_NOTES[month]}
                      </span>
                    </h2>
                    <span className="shrink-0 text-xs text-stone">
                      {foods.length}가지
                    </span>
                  </div>
                  <ul className="mt-4 grid grid-cols-4 gap-x-3 gap-y-4 md:grid-cols-6 lg:grid-cols-8">
                    {foods.map((food) => (
                      <li key={food.id} className="min-w-0">
                        <Link
                          href={routes.seasonal.food(food.id)}
                          className="flex flex-col items-center gap-1 text-center text-xs text-ink no-underline hover:text-ink"
                        >
                          <span className="relative block w-full rounded-md bg-surface/60 p-1.5">
                            <FoodImage
                              food={food}
                              sizes="100px"
                              showName={false}
                            />
                            <EatenBadgeToday foodId={food.id} />
                          </span>
                          <span className="w-full truncate">{food.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}

            <nav
              aria-label="다른 계절 둘러보기"
              className="grid grid-cols-2 gap-3 border-t border-hairline pt-6"
            >
              <SeasonStep season={previous} direction="prev" />
              <SeasonStep season={next} direction="next" />
            </nav>
          </div>
        </div>
      </div>
    </ViewTransition>
  )
}

function SeasonStep({
  season,
  direction,
}: {
  season: Season
  direction: "prev" | "next"
}) {
  const name = SEASON_COPY[season].name
  const Arrow = direction === "prev" ? ArrowLeft : ArrowRight
  return (
    <Link
      href={routes.seasonal.season(season)}
      transitionTypes={[direction === "next" ? "season-next" : "season-prev"]}
      className="group flex min-w-0 flex-col gap-3 rounded-xl border border-hairline bg-surface/85 p-4 text-ink no-underline hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span className="flex items-center justify-between gap-2 text-xs text-stone">
        {direction === "prev" ? "이전 계절" : "다음 계절"}
        <Arrow aria-hidden size={16} />
      </span>
      <span
        className="border-l-[3px] pl-3"
        style={{ borderColor: SEASON_COLOR_VAR[season] }}
      >
        <span className="block font-heading text-2xl font-bold">{name}</span>
        <span className="mt-1 block text-xs text-stone">
          {SEASON_MONTHS[season].join("·")}월
        </span>
      </span>
      <span className="text-xs text-stone">
        {foodsInSeason(season).length}가지 제철 보기
      </span>
    </Link>
  )
}
