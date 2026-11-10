import { ChevronRight } from "lucide-react"
import Link from "next/link"
import type { ReactNode, Ref } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"
import type { ProductSummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { productSub } from "./product-sub"
import { ROW_COLUMNS } from "./variety-row"

/**
 * 상품 행: 이름 · 품목·용량 | 판매가 · 기준 단위당 가격 · 조사일 | ›. 검색 결과와 상품 카테고리 페이지가 같이 쓴다.
 * 식재료 행(VarietyRow)과 같은 열(ROW_COLUMNS)에 놓고, 판정 칩 자리는 비운다(판정 없음은 묶음 설명이 알린다). 행 전체가 상품 상세 링크다.
 * name · sub는 검색어를 강조한 이름처럼 그 자리를 바꿀 때 넘긴다. 없으면 상품명과 "품목 · 용량"(hideItem이면 용량만)이다.
 */
export function ProductRow({
  product,
  hideItem = false,
  name,
  sub,
  linkRef,
}: {
  product: ProductSummary
  /** 품목 제목 아래에 놓일 때 작은 줄에서 품목을 뺀다 */
  hideItem?: boolean
  name?: ReactNode
  sub?: ReactNode
  linkRef?: Ref<HTMLAnchorElement>
}) {
  const subLine = sub ?? productSub(product, hideItem)
  return (
    <li className={cn(ROW_COLUMNS, "border-b border-hairline last:border-b-0")}>
      <Link
        href={routes.price.product(product.id)}
        ref={linkRef}
        className="col-span-full grid min-h-16 scroll-my-20 grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-x-3 rounded-lg py-2.5 no-underline outline-offset-2 hover:bg-mat focus-visible:outline-2 focus-visible:outline-ring active:bg-mat sm:grid-cols-subgrid"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-base leading-snug font-semibold [overflow-wrap:anywhere] break-keep text-ink">
            {name ?? product.name}
          </span>
          {subLine && (
            <span className="text-[13px] leading-snug [overflow-wrap:anywhere] break-keep text-caption">
              {subLine}
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
                  : PRICE_COPY.product.discontinuedShort}
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
