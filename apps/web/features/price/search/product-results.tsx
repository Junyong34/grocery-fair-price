"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRef, useState, type Ref } from "react"
import { flushSync } from "react-dom"

import { PRICE_COPY } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"
import { matchRange } from "@workspace/price/search"
import type { ProductSummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { Highlighted } from "./highlighted"

const COPY = PRICE_COPY.search

/** 처음 보이는 상품 수. 나머지는 "더 보기"로 편다(라면 · 음료처럼 수십 개가 맞는 검색어). */
const SHOWN = 12

/**
 * 식재료 결과 아래 "상품 판매가" 묶음(catalog-scale/10). 상품은 판정이 없어 판정 칩 대신 판매가와 기준 단위당 가격을 보인다.
 * byItem이면 품목마다 작은 제목을 달아 나눈다(카테고리 둘러보기).
 */
export function ProductResults({
  products,
  headingId,
  query,
  byItem = false,
}: {
  products: readonly ProductSummary[]
  headingId: string
  query?: string
  byItem?: boolean
}) {
  const [open, setOpen] = useState(false)
  const firstRevealed = useRef<HTMLAnchorElement>(null)
  const shown = open || byItem ? products : products.slice(0, SHOWN)
  const groups = byItem ? groupByItem(shown) : [{ item: null, rows: shown }]
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        tabIndex={-1}
        className="flex scroll-mt-20 flex-wrap items-baseline gap-x-2 font-heading text-xl leading-snug font-bold text-ink outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring lg:scroll-mt-24"
      >
        {COPY.products}
        <span className="font-sans text-sm font-semibold text-gold-deep tabular-nums">
          {COPY.productsCount(products.length)}
        </span>
      </h2>
      {groups.map(({ item, rows }) => (
        <div
          key={item ?? "all"}
          className="rounded-3xl bg-pair-light px-4 lg:px-5"
        >
          {item && (
            <h3 className="border-b border-hairline pt-4 pb-2 text-sm font-semibold text-stone">
              {item}
            </h3>
          )}
          <ul>
            {rows.map((product, index) => (
              <ProductRow
                key={product.id}
                product={product}
                query={query}
                linkRef={open && index === SHOWN ? firstRevealed : undefined}
              />
            ))}
          </ul>
        </div>
      ))}
      {!open && !byItem && products.length > SHOWN && (
        <button
          type="button"
          onClick={() => {
            flushSync(() => setOpen(true))
            firstRevealed.current?.focus()
          }}
          className="flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-silver px-4 text-sm font-semibold text-stone hover:border-stone hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {COPY.productsMore(products.length - SHOWN)}
          <ChevronDown aria-hidden size={16} strokeWidth={2.25} />
        </button>
      )}
    </section>
  )
}

function groupByItem(
  rows: readonly ProductSummary[]
): { item: string; rows: ProductSummary[] }[] {
  const out = new Map<string, ProductSummary[]>()
  for (const row of rows) out.set(row.item, [...(out.get(row.item) ?? []), row])
  return [...out].map(([item, list]) => ({ item, rows: list }))
}

/** 상품 행: 이름 · 품목 · 용량 | 판매가 · 기준 단위당 가격. 누르면 상품 상세로 간다. */
function ProductRow({
  product,
  query,
  linkRef,
}: {
  product: ProductSummary
  query?: string
  linkRef?: Ref<HTMLAnchorElement>
}) {
  // 상품명에서 맞지 않은 경우에만 품목명에 검색 근거를 보여 준다.
  const highlightItem =
    query && product.item && !matchRange(product.name, query)
  return (
    <li className="border-b border-hairline last:border-b-0">
      <Link
        href={routes.price.product(product.id)}
        ref={linkRef}
        className="grid min-h-16 scroll-my-20 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 rounded-lg py-2.5 no-underline outline-offset-2 hover:bg-mat focus-visible:outline-2 focus-visible:outline-ring active:bg-mat sm:gap-x-3"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-base leading-snug font-semibold [overflow-wrap:anywhere] break-keep text-ink">
            {query ? (
              <Highlighted name={product.name} query={query} />
            ) : (
              product.name
            )}
          </span>
          <span className="text-[13px] leading-relaxed [overflow-wrap:anywhere] break-keep text-caption">
            {highlightItem ? (
              <Highlighted name={product.item} query={query} />
            ) : (
              product.item
            )}
            {product.item && product.size && " · "}
            {product.size}
          </span>
        </span>
        <span className="flex max-w-28 flex-col gap-0.5 text-end tabular-nums sm:max-w-none">
          <span className="text-lg leading-snug font-semibold whitespace-nowrap text-ink">
            {won(product.price)}원
          </span>
          <span className="text-[13px] leading-snug break-keep text-caption">
            {product.perUnit ? (
              PRICE_COPY.product.perUnit(
                product.perUnit.unit,
                product.perUnit.price
              )
            ) : (
              <>
                <time dateTime={product.surveyedOn}>
                  {monthDay(product.surveyedOn)}
                </time>{" "}
                조사
              </>
            )}
          </span>
        </span>
        <ChevronRight
          aria-hidden
          size={16}
          className="text-caption rtl:rotate-180"
        />
      </Link>
    </li>
  )
}
