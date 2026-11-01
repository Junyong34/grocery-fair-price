"use client"

import { ClearRow } from "@/shared/settings/clear-row"

import { clearBasket, useBasketCount, useBasketHydrated } from "../stores/basket-store"
import { clearRecent, useRecentHydrated, useRecentIds } from "../stores/recent-store"

/** 설정 화면 "내 기록" 섹션의 시세 기록: 담은 품종 · 최근 본 품종 지우기. */
export function PriceRecordSettings() {
  const basket = useBasketCount()
  const basketReady = useBasketHydrated()
  const recent = useRecentIds().length
  const recentReady = useRecentHydrated()
  return (
    <>
      <ClearRow label="담은 품종" where="담은 품종" count={basketReady ? basket : null} onClear={clearBasket} />
      <ClearRow label="최근 본 품종" where="시세" count={recentReady ? recent : null} onClear={clearRecent} />
    </>
  )
}
