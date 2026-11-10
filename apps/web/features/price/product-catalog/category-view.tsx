import { ChevronLeft } from "lucide-react"
import Link from "next/link"

import { PRICE_COPY } from "@workspace/price/copy"
import { groupByItem, type ProductCategory } from "@workspace/price/list"
import type { ProductSummary, VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { AddButton } from "../components/add-button"
import { CategoryLinks } from "../components/category-links"
import { ProductRow } from "../components/product-row"
import { VarietyRow } from "../components/variety-row"

const COPY = PRICE_COPY.catalog

/**
 * 상품 카테고리 페이지: 그 카테고리의 식재료 시세(있으면)와 모든 상품을 품목별로 보인다.
 * 접거나 "더 보기"로 숨기지 않는다. 이 페이지의 링크가 상품 상세로 가는 유일한 길이라 처음 HTML에 모두 있어야 한다.
 */
export function CategoryView({
  category,
  products,
  varieties,
  others,
}: {
  category: ProductCategory
  /** 이 카테고리의 상품, 품목 · 이름 순 */
  products: readonly ProductSummary[]
  /** 같은 카테고리의 식재료 시세. 없으면 묶음을 뺀다 */
  varieties: readonly VarietySummary[]
  /** 다른 상품 카테고리 */
  others: readonly ProductCategory[]
}) {
  return (
    <article className="price-page flex flex-col gap-8 pt-4 pb-6 lg:pt-8">
      <header className="flex flex-col gap-2">
        <Link
          href={routes.price.products}
          className="-ms-1 inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-stone no-underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronLeft aria-hidden size={16} strokeWidth={2.25} className="rtl:rotate-180" />
          {COPY.title}
        </Link>
        <h1 className="font-heading text-3xl leading-[1.25] font-bold tracking-[-0.015em] text-ink lg:text-4xl">
          {COPY.categoryTitle(category.name)}
        </h1>
        <p className="text-sm leading-relaxed break-keep text-caption">
          {COPY.count(category.count)} · {COPY.productsNote}
        </p>
      </header>

      {varieties.length > 0 && (
        <section aria-labelledby="category-varieties-title" className="flex flex-col gap-3">
          <header className="flex flex-col gap-1">
            <h2 id="category-varieties-title" className="font-heading text-xl leading-snug font-bold text-ink">
              {COPY.varieties(category.name)}
            </h2>
            <p className="text-[13px] leading-relaxed break-keep text-caption">
              {COPY.varietiesNote}
            </p>
          </header>
          <ul className="rounded-3xl bg-pair-light px-4 lg:px-5">
            {varieties.map((variety) => (
              <VarietyRow
                key={variety.id}
                variety={variety}
                action={<AddButton variety={variety} />}
              />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="category-products-title" className="flex flex-col gap-5">
        <h2 id="category-products-title" className="font-heading text-xl leading-snug font-bold text-ink">
          {COPY.homeTitle}
        </h2>
        {groupByItem(products).map(({ item, rows }) => (
          <div key={item} className="flex flex-col gap-2">
            <h3 className="flex items-baseline gap-1.5 px-1 text-sm font-semibold text-stone">
              {item}
              <span className="text-[13px] font-medium text-caption tabular-nums">
                {rows.length}
              </span>
            </h3>
            <ul className="rounded-3xl bg-pair-light px-4 lg:px-5">
              {rows.map((product) => (
                <ProductRow key={product.id} product={product} hideItem />
              ))}
            </ul>
          </div>
        ))}
      </section>

      {others.length > 0 && (
        <nav aria-labelledby="category-others-title" className="flex flex-col gap-3 border-t border-hairline pt-6">
          <h2 id="category-others-title" className="text-base font-semibold text-ink">
            {COPY.others}
          </h2>
          <CategoryLinks categories={others} />
        </nav>
      )}
    </article>
  )
}
