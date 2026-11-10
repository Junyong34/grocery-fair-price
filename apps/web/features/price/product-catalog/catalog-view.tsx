import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { PRICE_COPY } from "@workspace/price/copy"
import type { ProductCategory } from "@workspace/price/list"

import { routes } from "@/shared/routes"

const COPY = PRICE_COPY.catalog

/** 카드에 예로 보이는 품목 수 */
const ITEMS_SHOWN = 4

/**
 * 상품 목록(/products): 상품이 있는 카테고리를 카드로 늘어놓는다. 카드는 카테고리 페이지로 간다.
 * 상품은 검색으로만 찾을 수 있었다. 이 화면과 카테고리 페이지가 링크만 따라 모든 상품 상세에 닿는 길이다.
 */
export function CatalogView({
  categories,
}: {
  categories: readonly ProductCategory[]
}) {
  return (
    <div className="price-page flex flex-col gap-7 pt-6 pb-6 lg:pt-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl leading-[1.25] font-bold tracking-[-0.015em] text-ink lg:text-4xl">
          {COPY.title}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-pretty break-keep text-caption">
          {COPY.lead}
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(({ slug, name, count, items }) => (
          <li key={slug}>
            <Link
              href={routes.price.productCategory(slug)}
              className="flex h-full min-h-20 items-center justify-between gap-3 rounded-2xl border border-hairline bg-pair-light px-4 py-3.5 text-pair-light-foreground no-underline hover:border-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-base font-semibold text-ink">
                    {name}
                  </span>
                  <span className="text-[13px] font-medium text-caption tabular-nums">
                    {COPY.count(count)}
                  </span>
                </span>
                <span className="text-[13px] leading-relaxed [overflow-wrap:anywhere] break-keep text-caption">
                  {items.slice(0, ITEMS_SHOWN).join(" · ")}
                  {items.length > ITEMS_SHOWN && " …"}
                </span>
              </span>
              <ChevronRight
                aria-hidden
                size={18}
                strokeWidth={2}
                className="shrink-0 text-mute rtl:rotate-180"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
