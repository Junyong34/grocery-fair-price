import { Info } from "lucide-react"
import Link from "next/link"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import {
  listBasisLine,
  listSourceLine,
  PRICE_COPY,
} from "@workspace/price/copy"
import { pickByIds } from "@workspace/price/list"
import type { VarietySummary } from "@workspace/price/types"

import { DownloadsCard } from "@/shared/downloads/downloads-card"
import { routes } from "@/shared/routes"

import { AddButton } from "../components/add-button"
import { RecentPills } from "../components/recent-varieties"
import { SearchEntry } from "../components/search-entry"
import { HOME_SEARCH_ID } from "./search-id"
import { HomeSearchRow } from "./search-row"
import { PriceHint, VarietyRow } from "../components/variety-row"

/** P1 시세 메인: 검색·품종 목록을 먼저 보여 주고, 가격 설명과 조사 범위는 제목 옆 안내에서 확인한다. */
export function HomeView({
  varieties,
  featuredIds,
}: {
  varieties: readonly VarietySummary[]
  featuredIds: readonly string[]
}) {
  const featured = pickByIds(varieties, featuredIds)
  const basisLine = listBasisLine(featured)
  const sourceLine = listSourceLine(featured)
  return (
    <div className="price-page flex flex-col gap-9 pt-6 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-8 lg:pt-8">
      <div className="contents lg:col-start-1 lg:row-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-9 lg:pt-5">
        <div className="flex flex-col gap-5">
          <h1 className="font-heading text-[28px] leading-[1.35] tracking-[-0.02em] text-ink lg:text-[32px]">
            {PRICE_COPY.home.title[0]}
            <br />
            {PRICE_COPY.home.title[1]}
          </h1>
          <div id={HOME_SEARCH_ID}>
            <SearchEntry />
          </div>
          <HomeSearchRow />
        </div>
        <RecentPills varieties={varieties} />
      </div>
      <section
        aria-labelledby="featured-title"
        className="flex min-w-0 flex-col gap-2 rounded-2xl border border-hairline bg-surface/50 p-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:p-5"
      >
        <div className="flex items-center">
          <h2 id="featured-title" className="text-base font-semibold text-ink">
            {PRICE_COPY.home.featured}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={PRICE_COPY.home.priceInfo}
                className="inline-flex size-11 items-center justify-center rounded-full text-caption hover:bg-mat hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Info aria-hidden size={16} strokeWidth={1.6} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              aria-label={PRICE_COPY.home.priceInfo}
              align="start"
              collisionPadding={18}
              className="w-72 max-w-[calc(100vw-36px)]"
            >
              <h3 className="text-sm font-semibold text-ink">
                {PRICE_COPY.home.priceInfo}
              </h3>
              <PriceHint className="mt-3" />
              {basisLine && (
                <p className="mt-3 border-t border-hairline pt-3 text-xs leading-relaxed text-caption">
                  {basisLine}
                </p>
              )}
            </PopoverContent>
          </Popover>
        </div>
        <ul>
          {featured.map((variety) => (
            <VarietyRow
              key={variety.id}
              variety={variety}
              action={<AddButton variety={variety} />}
            />
          ))}
        </ul>
        <Link href={routes.price.varieties} className="self-start py-2 text-sm text-ink underline underline-offset-4">
          {PRICE_COPY.home.allVarieties}
        </Link>
        {sourceLine && (
          <p className="mt-2 text-right text-xs leading-relaxed text-caption">
            {sourceLine}
          </p>
        )}
      </section>
      <DownloadsCard
        placement="price-home"
        className="lg:col-start-1 lg:row-start-2"
      />
    </div>
  )
}
