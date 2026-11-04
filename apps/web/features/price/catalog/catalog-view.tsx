import { PRICE_COPY } from "@workspace/price/copy"
import { groupByCategory } from "@workspace/price/list"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"
import { SubHeader } from "@/shared/shell/sub-header"

import { AddButton } from "../components/add-button"
import { VarietyRow } from "../components/variety-row"

/**
 * 품종 허브(/prices): 판정이 있는 모든 품종을 카테고리별로 늘어놓는다.
 * 메인은 자주 사는 품종만, 검색은 noindex라 이 화면이 모든 품종 상세로 가는 색인 가능한 입구다.
 */
export function CatalogView({ varieties }: { varieties: readonly VarietySummary[] }) {
  const groups = groupByCategory(varieties)
  return (
    <div className="price-page flex flex-col gap-8 pt-6 pb-12 lg:pt-8">
      <header className="flex flex-col gap-2">
        <SubHeader title={PRICE_COPY.catalog.title} fallbackHref={routes.home} revealAfter="catalog-title" />
        <h1 id="catalog-title" className="font-heading text-[28px] leading-tight text-ink lg:text-[32px]">{PRICE_COPY.catalog.title}</h1>
        <p className="max-w-prose text-sm leading-relaxed text-stone">{PRICE_COPY.catalog.intro(varieties.length)}</p>
        {groups.length > 1 && (
          <nav aria-label={PRICE_COPY.catalog.categoryNav} className="flex flex-wrap gap-2 pt-1">
            {groups.map(({ category }, index) => (
              <a key={category} href={`#category-${index}`} className="rounded-full border border-hairline px-3 py-1.5 text-[13px] text-ink no-underline hover:bg-mat">
                {category}
              </a>
            ))}
          </nav>
        )}
      </header>
      {groups.map(({ category, rows }, index) => (
        <section key={category} id={`category-${index}`} aria-labelledby={`category-${index}-title`} className="flex scroll-mt-20 flex-col gap-1">
          <h2 id={`category-${index}-title`} className="flex items-baseline justify-between text-base font-semibold text-ink">
            {category}
            <span className="text-xs font-normal text-caption">{PRICE_COPY.catalog.count(rows.length)}</span>
          </h2>
          <ul>
            {rows.map((variety) => (
              <VarietyRow key={variety.id} variety={variety} action={<AddButton variety={variety} />} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
