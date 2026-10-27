import { LIST_BASIS, listBasisLine, PRICE_COPY } from "@workspace/price/copy"
import { monthDay } from "@workspace/price/format"
import { latestSurveyedOn, pickByIds } from "@workspace/price/list"
import type { VarietySummary } from "@workspace/price/types"

import { AddButton } from "../components/add-button"
import { RecentPills } from "../components/recent-varieties"
import { SearchEntry } from "../components/search-entry"
import { PriceHint, VarietyRow } from "../components/variety-row"

/** P1 시세 메인: 큰 제목과 검색창, 최근 본 품종, 자주 사는 품종, 근거 한 줄. */
export function HomeView({
  varieties,
  featuredIds,
}: {
  varieties: readonly VarietySummary[]
  featuredIds: readonly string[]
}) {
  const featured = pickByIds(varieties, featuredIds)
  const surveyedOn = latestSurveyedOn(varieties)
  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-9 px-[18px] pt-6 lg:pt-12">
      <div className="flex flex-col gap-5">
        <h1 className="font-heading text-[28px] leading-[1.35] tracking-[-0.02em] text-ink lg:text-[36px]">
          {PRICE_COPY.home.title[0]}
          <br />
          {PRICE_COPY.home.title[1]}
        </h1>
        <SearchEntry />
      </div>
      <RecentPills varieties={varieties} />
      <section aria-labelledby="featured-title" className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <h2 id="featured-title" className="text-[15px] font-semibold text-ink">
            {PRICE_COPY.home.featured}
          </h2>
          {surveyedOn && <span className="text-xs text-caption">{monthDay(surveyedOn)} 조사</span>}
        </div>
        <PriceHint />
        <ul className="mt-1">
          {featured.map((variety) => (
            <VarietyRow key={variety.id} variety={variety} action={<AddButton variety={variety} />} />
          ))}
        </ul>
      </section>
      {surveyedOn && <p className="text-xs text-caption">{listBasisLine(LIST_BASIS, surveyedOn)}</p>}
    </div>
  )
}
