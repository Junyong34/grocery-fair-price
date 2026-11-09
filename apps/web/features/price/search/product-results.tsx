"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRef, useState, type Ref } from "react"
import { flushSync } from "react-dom"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"
import { matchRange } from "@workspace/price/search"
import type { ProductSummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { ROW_COLUMNS } from "../components/variety-row"
import { Highlighted } from "./highlighted"
import { productSub } from "./product-sub"
import { ResultSection } from "./result-section"

const COPY = PRICE_COPY.search

/** 처음 보이는 상품 수. 나머지는 "더 보기"로 편다(라면 · 음료처럼 수십 개가 맞는 검색어). */
const SHOWN = 12

/** 묶음 설명. 식재료 시세와 달리 판정이 없다는 것을 제목 바로 아래에서 알린다(GLOSSARY: 상품 · 판매가). */
const PRODUCTS_NOTE = "참가격이 조사한 전국 판매가예요 · 판정은 하지 않아요"

/** 참가격이 더 조사하지 않는 상품 표식. 오래됨(stale)은 식재료 행과 같은 말을 쓴다. */
const DISCONTINUED = "조사 중단"

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
      description={PRODUCTS_NOTE}
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
          query={query}
          hideItem={hideItem}
          linkRef={index === revealedIndex ? revealedRef : undefined}
        />
      ))}
    </ul>
  )
}

function groupByItem(
  rows: readonly ProductSummary[]
): { item: string; rows: ProductSummary[] }[] {
  const out = new Map<string, ProductSummary[]>()
  for (const row of rows) out.set(row.item, [...(out.get(row.item) ?? []), row])
  return [...out].map(([item, list]) => ({ item, rows: list }))
}

/**
 * 상품 행: 이름 · 품목·용량 | 판매가 · 기준 단위당 가격 · 조사일 | ›.
 * 식재료 행과 같은 열에 놓고, 판정 칩 자리는 비운다(판정 없음은 묶음 설명이 알린다). 행 전체가 상품 상세 링크다.
 */
function ProductRow({
  product,
  query,
  hideItem,
  linkRef,
}: {
  product: ProductSummary
  query?: string
  hideItem: boolean
  linkRef?: Ref<HTMLAnchorElement>
}) {
  const sub = productSub(product, hideItem)
  // 상품명에서 맞지 않은 경우에만 품목명에 검색 근거를 보여 준다.
  const highlightItem =
    query && !hideItem && product.item && !matchRange(product.name, query)
  return (
    <li className={cn(ROW_COLUMNS, "border-b border-hairline last:border-b-0")}>
      <Link
        href={routes.price.product(product.id)}
        ref={linkRef}
        className="col-span-full grid min-h-16 scroll-my-20 grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-x-3 rounded-lg py-2.5 no-underline outline-offset-2 hover:bg-mat focus-visible:outline-2 focus-visible:outline-ring active:bg-mat sm:grid-cols-subgrid"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-base leading-snug font-semibold [overflow-wrap:anywhere] break-keep text-ink">
            {query ? (
              <Highlighted name={product.name} query={query} />
            ) : (
              product.name
            )}
          </span>
          {sub && (
            <span className="text-[13px] leading-snug [overflow-wrap:anywhere] break-keep text-caption">
              {highlightItem ? (
                <>
                  <Highlighted name={product.item} query={query} />
                  {sub.slice(product.item.length)}
                </>
              ) : (
                sub
              )}
            </span>
          )}
        </span>
        {/* 넓은 화면에서는 판정 칩 열까지 가격 칸으로 써 "100g당 1,290원" 같은 긴 줄이 넘치지 않게 한다. */}
        <span className="flex flex-col items-end gap-0.5 justify-self-end text-end tabular-nums sm:col-span-2">
          <span className="text-lg leading-tight font-semibold whitespace-nowrap text-ink">
            {won(product.price)}원
          </span>
          {product.perUnit && (
            <span className="mt-0.5 text-[13px] leading-tight whitespace-nowrap text-caption">
              {PRICE_COPY.product.perUnit(
                product.perUnit.unit,
                product.perUnit.price
              )}
            </span>
          )}
          <span className="text-xs whitespace-nowrap text-caption">
            <time dateTime={product.surveyedOn}>
              {monthDay(product.surveyedOn)}
            </time>{" "}
            조사
            {product.status !== "active" && (
              <span className="ml-1 font-semibold text-stone">
                {product.status === "stale"
                  ? PRICE_COPY.row.stale
                  : DISCONTINUED}
              </span>
            )}
          </span>
        </span>
        <ChevronRight
          aria-hidden
          size={18}
          strokeWidth={2}
          className="justify-self-center text-mute rtl:rotate-180"
        />
      </Link>
    </li>
  )
}
