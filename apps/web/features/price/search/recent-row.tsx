import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { won } from "@workspace/price/format"

import { routes } from "@/shared/routes"

import { varietySub } from "../components/variety-row"
import { VerdictChip } from "../components/verdict-chip"
import type { RecentItem } from "../stores/recent-store"
import { productSub } from "./product-sub"

/**
 * P2 빈 검색어의 최근 본 품종 · 상품 한 줄(44px).
 * "방금 보던 것 다시 열기"라 평소가 · 조사일 · 담기는 뺀다(담기는 상세 헤더에 있다).
 * 품종은 이름 · 규격·단위 · 판정 칩 · 시세 · ›, 상품은 판정 칩 없이 상품명 · 품목·용량 · 판매가 · ›.
 */
export function RecentRow({ item }: { item: RecentItem }) {
  if (item.kind === "variety") {
    const { variety } = item
    return (
      <li className="border-b border-hairline last:border-b-0">
        <Link
          href={routes.price.variety(variety.id)}
          className="flex min-h-11 items-center gap-2 rounded-lg py-1.5 no-underline outline-offset-2 hover:bg-mat focus-visible:outline-2 focus-visible:outline-ring active:bg-mat"
        >
          <span className="max-w-[55%] shrink-0 truncate text-[15px] font-semibold text-ink">
            {variety.name}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-caption">
            {varietySub(variety)}
          </span>
          <VerdictChip verdict={variety.verdict} className="shrink-0" />
          <span className="w-[4.5rem] shrink-0 text-right text-[15px] font-semibold text-ink tabular-nums">
            {won(variety.price)}원
          </span>
          <ChevronRight aria-hidden size={16} className="shrink-0 text-mute" />
        </Link>
      </li>
    )
  }

  const { product } = item
  const sub = productSub(product)
  return (
    <li className="border-b border-hairline last:border-b-0">
      <Link
        href={routes.price.product(product.id)}
        className="flex min-h-11 items-center gap-2 rounded-lg py-1.5 no-underline outline-offset-2 hover:bg-mat focus-visible:outline-2 focus-visible:outline-ring active:bg-mat"
      >
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="min-w-0 truncate text-[15px] font-semibold text-ink">
            {product.name}
          </span>
          {sub && (
            <span className="max-w-[40%] shrink-0 truncate text-[13px] text-caption">
              {sub}
            </span>
          )}
        </span>
        <span className="w-[4.5rem] shrink-0 text-right text-[15px] font-semibold text-ink tabular-nums">
          {won(product.price)}원
        </span>
        <ChevronRight aria-hidden size={16} className="shrink-0 text-mute" />
      </Link>
    </li>
  )
}
