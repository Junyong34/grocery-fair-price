"use client"

import { useEffect } from "react"

import { rehydrateBasket } from "./basket-store"
import { useRecentStore } from "./recent-store"

/** 가격 영역 레이아웃에 한 번 둔다. 마운트 뒤 기기에 저장된 담은 품종 · 최근 본 품종을 불러온다. */
export function PriceStores() {
  useEffect(() => {
    void rehydrateBasket()
    void useRecentStore.persist.rehydrate()
  }, [])
  return null
}
