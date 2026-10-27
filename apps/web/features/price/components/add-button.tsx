"use client"

import { Check, Plus } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"
import type { VarietySummary } from "@workspace/price/types"

import { useBasketStore, useInBasket } from "../stores/basket-store"

/** 목록 행의 + 담기 / ✓ 담음. 담은 품종을 다시 누르면 뺀다. */
export function AddButton({ variety }: { variety: VarietySummary }) {
  const added = useInBasket(variety.id)
  const { add, remove } = useBasketStore.getState()
  return (
    <button
      type="button"
      aria-pressed={added}
      aria-label={added ? PRICE_COPY.row.remove(variety.name) : PRICE_COPY.row.add(variety.name)}
      onClick={() => (added ? remove(variety.id) : add(variety))}
      className={cn(
        "grid size-9 place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        added ? "border-ink bg-ink text-canvas" : "border-silver bg-surface text-ink hover:border-stone"
      )}
    >
      {added ? <Check aria-hidden size={16} strokeWidth={2.4} /> : <Plus aria-hidden size={17} strokeWidth={2} />}
    </button>
  )
}
