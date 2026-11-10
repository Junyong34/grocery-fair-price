"use client"

import type { ProductSummary, VarietySummary } from "@workspace/price/types"

import { deviceStore } from "@/shared/device-store"

// 최근 본 시세 · 상품(P1 · P2): 품종 상세 · 상품 상세를 연 순서, 최근 것이 앞. 기기(localStorage)에 저장한다.
// 서버 HTML과 첫 렌더는 빈 목록이고, 저장값은 마운트 뒤 불러온다(device-store).

const LIMIT = 8

export type RecentEntry = {
  kind: "variety" | "product"
  id: string
}

export type RecentItem =
  | { kind: "variety"; variety: VarietySummary }
  | { kind: "product"; product: ProductSummary }

const recentStore = deviceStore<{ entries: readonly RecentEntry[] }>(
  "price:recent",
  { entries: [] },
  {
    version: 2,
    // 1 → 2: 품종 id 배열(ids)을 품종·상품 공통 기록(entries)으로 옮긴다.
    migrate: (persisted, version) => {
      if (version >= 2) return persisted as { entries: readonly RecentEntry[] }
      const ids = (persisted as { ids?: readonly string[] } | null)?.ids ?? []
      return {
        entries: ids
          .filter((id): id is string => typeof id === "string")
          .slice(0, LIMIT)
          .map((id) => ({ kind: "variety" as const, id })),
      }
    },
  }
)

function visit(next: RecentEntry): void {
  recentStore.set(({ entries }) => ({
    entries: [
      next,
      ...entries.filter((other) => !(other.kind === next.kind && other.id === next.id)),
    ].slice(0, LIMIT),
  }))
}

/** 품종 상세를 열면 맨 앞에 넣는다. */
export function visitVariety(id: string): void {
  visit({ kind: "variety", id })
}

/** 상품 상세를 열면 맨 앞에 넣는다. */
export function visitProduct(id: string): void {
  visit({ kind: "product", id })
}

export function clearRecentVarieties(): void {
  recentStore.set(({ entries }) => ({
    entries: entries.filter((entry) => entry.kind !== "variety"),
  }))
}

export function recentEntries(): readonly RecentEntry[] {
  return recentStore.get().entries
}

export function useRecentEntries(): readonly RecentEntry[] {
  return recentStore.use((state) => state.entries)
}

export function useRecentVarietyCount(): number {
  return recentStore.use((state) => state.entries.filter((entry) => entry.kind === "variety").length)
}

/** 저장값을 불러왔는지. 불러오기 전에는 개수를 보이지 않는다. */
export function useRecentHydrated(): boolean {
  return recentStore.useHydrated()
}

/** 기록된 순서대로 품종 · 상품 요약을 찾는다. 목록에 없는 id는 건너뛴다. */
export function pickRecentItems(
  entries: readonly RecentEntry[],
  varieties: readonly VarietySummary[],
  products: readonly ProductSummary[]
): RecentItem[] {
  if (entries.length === 0) return []
  const varietyById = new Map(varieties.map((v) => [v.id, v]))
  const productById = new Map(products.map((p) => [p.id, p]))
  const out: RecentItem[] = []
  for (const entry of entries) {
    if (entry.kind === "variety") {
      const variety = varietyById.get(entry.id)
      if (variety) out.push({ kind: "variety", variety })
    } else {
      const product = productById.get(entry.id)
      if (product) out.push({ kind: "product", product })
    }
  }
  return out
}
