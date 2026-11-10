"use client"

import { ChevronDown } from "lucide-react"
import { useRef, useState, type ReactNode, type Ref } from "react"
import { flushSync } from "react-dom"

import { PRICE_COPY } from "@workspace/price/copy"
import { groupByItem } from "@workspace/price/list"
import { matchRange } from "@workspace/price/search"
import type { ProductSummary } from "@workspace/price/types"

import { ProductRow } from "../components/product-row"
import { productSub } from "../components/product-sub"
import { Highlighted } from "./highlighted"
import { ResultSection } from "./result-section"

const COPY = PRICE_COPY.search

/** 처음 보이는 상품 수. 나머지는 "더 보기"로 편다(라면 · 음료처럼 수십 개가 맞는 검색어). */
const SHOWN = 12

/**
 * 식재료 결과 아래 "상품 판매가" 묶음(catalog-scale/10). 상품은 판정이 없어 판정 칩 대신 판매가와 기준 단위당 가격을 보인다.
 * 행은 식재료 행(VarietyRow)과 같은 열(ROW_COLUMNS)에 놓아 두 묶음의 가격 · 오른쪽 끝 열이 한 줄로 맞는다.
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
  /** 상품명과 품목명에서 맞은 글자를 강조할 검색어. 카테고리 검색에서는 비운다 */
  query?: string
  byItem?: boolean
}) {
  const [open, setOpen] = useState(false)
  const firstRevealed = useRef<HTMLAnchorElement>(null)
  const shown = open || byItem ? products : products.slice(0, SHOWN)
  return (
    <ResultSection
      headingId={headingId}
      title={COPY.products}
      count={products.length}
      description={PRICE_COPY.catalog.productsNote}
      focusTarget
    >
      {byItem ? (
        <div className="flex flex-col gap-5">
          {groupByItem(shown).map(({ item, rows }) => (
            <div key={item} className="flex flex-col gap-2">
              <h3 className="flex items-baseline gap-1.5 px-1 text-sm font-semibold text-stone">
                {item}
                <span className="text-[13px] font-medium text-caption tabular-nums">
                  {rows.length}
                </span>
              </h3>
              <ProductList rows={rows} hideItem />
            </div>
          ))}
        </div>
      ) : (
        <ProductList
          rows={shown}
          query={query}
          revealedIndex={open ? SHOWN : undefined}
          revealedRef={firstRevealed}
        />
      )}
      {!open && !byItem && products.length > SHOWN && (
        <button
          type="button"
          onClick={() => {
            flushSync(() => setOpen(true))
            firstRevealed.current?.focus()
          }}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-silver bg-pair-light px-4 text-sm font-semibold text-stone hover:border-stone hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {COPY.productsMore(products.length - SHOWN)}
          <ChevronDown aria-hidden size={16} strokeWidth={2.25} />
        </button>
      )}
    </ResultSection>
  )
}

function ProductList({
  rows,
  query,
  hideItem = false,
  revealedIndex,
  revealedRef,
}: {
  rows: readonly ProductSummary[]
  query?: string
  hideItem?: boolean
  /** "더 보기"로 처음 펼쳐진 행. 포커스를 그 행으로 옮긴다 */
  revealedIndex?: number
  revealedRef?: Ref<HTMLAnchorElement>
}) {
  return (
    <ul className="rounded-3xl bg-pair-light px-4 lg:px-5">
      {rows.map((product, index) => (
        <ProductRow
          key={product.id}
          product={product}
          hideItem={hideItem}
          {...(query && highlighted(product, query, hideItem))}
          linkRef={index === revealedIndex ? revealedRef : undefined}
        />
      ))}
    </ul>
  )
}

/** 검색어가 맞은 글자를 강조한 이름과 작은 줄. 상품명에서 맞지 않은 경우에만 품목명에 검색 근거를 보여 준다. */
function highlighted(
  product: ProductSummary,
  query: string,
  hideItem: boolean
): { name: ReactNode; sub?: ReactNode } {
  const name = <Highlighted name={product.name} query={query} />
  const sub = productSub(product, hideItem)
  if (hideItem || !sub || !product.item || matchRange(product.name, query))
    return { name }
  return {
    name,
    sub: (
      <>
        <Highlighted name={product.item} query={query} />
        {sub.slice(product.item.length)}
      </>
    ),
  }
}
