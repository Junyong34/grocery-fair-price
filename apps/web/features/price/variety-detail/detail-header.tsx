"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { varietySub } from "../components/variety-row"
import { toggleBasket } from "../components/basket-toast"
import { useInBasket } from "../stores/basket-store"
import { useRecentStore } from "../stores/recent-store"

const COPY = PRICE_COPY.detail

/** P3 앱 바: ‹ 뒤로 · 품종 이름 · 규격 · 기준 단위 · + 담기 / ✓ 담음. 연 품종을 최근 본 품종에 넣는다. */
export function DetailHeader({ variety }: { variety: VarietySummary }) {
  const router = useRouter()
  const added = useInBasket(variety.id)

  useEffect(() => {
    // 기기 저장 값을 불러온 뒤에 넣어야 불러오기가 덮어쓰지 않는다.
    const visit = () => useRecentStore.getState().visit(variety.id)
    if (useRecentStore.persist.hasHydrated()) visit()
    else return useRecentStore.persist.onFinishHydration(visit)
  }, [variety.id])

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={COPY.back}
        onClick={() => (window.history.length > 1 ? router.back() : router.push(routes.home))}
        className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-ink hover:bg-surface"
      >
        <ChevronLeft aria-hidden size={24} />
      </button>
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h1 className="truncate font-heading text-[26px] leading-tight font-bold text-ink">{variety.name}</h1>
        <span className="shrink-0 text-sm text-caption">{varietySub(variety)}</span>
      </div>
      <button
        type="button"
        aria-pressed={added}
        onClick={() => toggleBasket(variety, added)}
        className={cn(
          "h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition-colors",
          added ? "border-ink bg-ink text-canvas" : "border-silver bg-surface text-ink hover:border-stone"
        )}
      >
        {added ? COPY.added : COPY.add}
      </button>
    </div>
  )
}
