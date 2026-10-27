"use client"

import Link from "next/link"

import { PRICE_COPY } from "@workspace/price/copy"
import { pickByIds } from "@workspace/price/list"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { useRecentStore } from "../stores/recent-store"
import { VerdictDot } from "./verdict-chip"

/** 최근 본 품종 id를 목록 행으로. 기기 저장이라 하이드레이션 뒤에 채워진다. */
export function useRecentVarieties(varieties: readonly VarietySummary[]): VarietySummary[] {
  const ids = useRecentStore((state) => state.ids)
  return pickByIds(varieties, ids)
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
          onClick={() => useRecentStore.getState().clear()}
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
              className="inline-flex h-9 items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 text-sm text-ink no-underline hover:border-stone"
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
