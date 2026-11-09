"use client"

import Link from "next/link"
import { useState } from "react"

import { PRICE_COPY } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"
import type { ProductSummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

const COPY = PRICE_COPY.search

/** 처음 보이는 상품 수. 나머지는 "더 보기"로 편다(라면 · 음료처럼 수십 개가 맞는 검색어). */
const SHOWN = 12

/**
 * 식재료 결과 아래 "상품 판매가" 묶음(catalog-scale/10). 상품은 판정이 없어 판정 칩 대신 판매가와 기준 단위당 가격을 보인다.
 * byItem이면 품목마다 작은 제목을 달아 나눈다(카테고리 둘러보기).
 */
export function ProductResults({
  products,
  ids,
  byItem = false,
}: {
  products: readonly ProductSummary[]
  ids: readonly string[]
  byItem?: boolean
}) {
  const [open, setOpen] = useState(false)
  const byId = new Map(products.map((p) => [p.id, p]))
  const found = ids.flatMap((id) => byId.get(id) ?? [])
  if (found.length === 0) return null
  const shown = open || byItem ? found : found.slice(0, SHOWN)
  const groups = byItem ? groupByItem(shown) : [{ item: null, rows: shown }]
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-baseline gap-1.5 text-[13px] font-semibold text-stone">
        {COPY.products}
        <span className="font-normal text-caption">{COPY.productsCount(found.length)}</span>
      </h2>
      {groups.map(({ item, rows }) => (
        <div key={item ?? "all"} className="flex flex-col">
          {item && <h3 className="border-b border-hairline pt-2 pb-1.5 text-[13px] font-semibold text-ink">{item}</h3>}
          <ul>
            {rows.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </ul>
        </div>
      ))}
      {!open && !byItem && found.length > SHOWN && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 w-full rounded-full border border-silver text-sm font-semibold text-stone hover:border-stone hover:text-ink"
        >
          {COPY.productsMore(found.length - SHOWN)}
        </button>
      )}
    </section>
  )
}

function groupByItem(rows: readonly ProductSummary[]): { item: string; rows: ProductSummary[] }[] {
  const out = new Map<string, ProductSummary[]>()
  for (const row of rows) out.set(row.item, [...(out.get(row.item) ?? []), row])
  return [...out].map(([item, list]) => ({ item, rows: list }))
}

/** 상품 행: 이름 · 품목 · 용량 | 판매가 · 기준 단위당 가격. 누르면 상품 상세로 간다. */
function ProductRow({ product }: { product: ProductSummary }) {
  return (
    <li className="border-b border-hairline last:border-b-0">
      <Link
        href={routes.price.product(product.id)}
        className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg py-2.5 no-underline outline-offset-2 hover:bg-mat focus-visible:outline-2 focus-visible:outline-ring active:bg-mat"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-[15px] leading-snug font-semibold [overflow-wrap:anywhere] break-keep text-ink">{product.name}</span>
          <span className="text-[13px] leading-snug text-caption">
            {[product.item, product.size].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className="flex flex-col items-end gap-0.5 leading-tight tabular-nums">
          <span className="text-base font-semibold text-ink">{won(product.price)}원</span>
          <span className="text-xs whitespace-nowrap text-caption">
            {product.perUnit ? PRICE_COPY.product.perUnit(product.perUnit.unit, product.perUnit.price) : `${monthDay(product.surveyedOn)} 조사`}
          </span>
        </span>
      </Link>
    </li>
  )
}
