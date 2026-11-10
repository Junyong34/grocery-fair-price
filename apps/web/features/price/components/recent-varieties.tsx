"use client"

import Link from "next/link"

import { PRICE_COPY } from "@workspace/price/copy"
import { pickByIds } from "@workspace/price/list"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { clearRecentVarieties, pickRecentItems, useRecentEntries, type RecentItem } from "../stores/recent-store"
import { VerdictDot } from "./verdict-chip"

import type { ProductSummary } from "@workspace/price/types"

/** 최근 본 품종 id를 목록 행으로(P1 홈 알약). 기기 저장이라 하이드레이션 뒤에 채워진다. */
export function useRecentVarieties(varieties: readonly VarietySummary[]): VarietySummary[] {
  const entries = useRecentEntries()
  const ids = entries.filter((entry) => entry.kind === "variety").map((entry) => entry.id)
  return pickByIds(varieties, ids)
}

/** 최근 본 품종 · 상품을 본 순서대로(P2 검색). 기기 저장이라 하이드레이션 뒤에 채워진다. */
export function useRecentItems(
  varieties: readonly VarietySummary[],
  products: readonly ProductSummary[]
): RecentItem[] {
  const entries = useRecentEntries()
  return pickRecentItems(entries, varieties, products)
}

/** P1 최근 본 품종: 판정 색 점이 붙은 알약. 본 품종이 없으면 칸째 숨긴다. */
export function RecentPills({ varieties }: { varieties: readonly VarietySummary[] }) {
  const recent = useRecentVarieties(varieties)
  if (!recent.length) return null
  return (
    <section aria-labelledby="recent-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="recent-title" className="text-[15px] font-semibold text-ink">
          {PRICE_COPY.home.recent}
        </h2>
        <button
          type="button"
          onClick={clearRecentVarieties}
          className="text-xs text-caption underline-offset-2 hover:text-ink hover:underline"
        >
          {PRICE_COPY.home.clearRecent}
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {recent.map((variety) => (
          <li key={variety.id}>
            <Link
              href={routes.price.variety(variety.id)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-hairline bg-pair-light px-3.5 text-sm text-pair-light-foreground no-underline hover:border-stone"
            >
              <VerdictDot verdict={variety.verdict} />
              {variety.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
