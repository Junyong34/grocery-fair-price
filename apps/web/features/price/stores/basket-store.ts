"use client"

import { useSyncExternalStore } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { BasketEntry } from "@workspace/price/basket"
import type { VarietySummary } from "@workspace/price/types"

// 담은 품종(P4): 담은 순서와, 담을 때의 판정 · 그 판정의 조사일. 기기(localStorage)에 저장한다.
// 담을 때 판정을 남겨 "10/16에 담을 때 보통 → 지금 싸요"를 보여 준다. 날짜는 시계가 아니라 그 판정의 조사일이다.
// skipHydration이라 서버 HTML과 첫 렌더는 빈 목록이고, PriceStores가 마운트 뒤 불러온다.
// 화면은 store를 직접 고치지 않고 아래 함수와 훅만 쓴다(담을 때 토스트는 components/basket-toast의 toggleBasket).

type BasketState = { entries: readonly BasketEntry[] }

const useBasketStore = create<BasketState>()(
  persist((): BasketState => ({ entries: [] }), { name: "price:basket", version: 1, skipHydration: true })
)

/** 담은 품종(담은 순서). */
export function basketEntries(): readonly BasketEntry[] {
  return useBasketStore.getState().entries
}

/** 담는다. 담을 때의 판정과 그 판정의 조사일을 남긴다. 이미 담았으면 처음 기록을 두고 false. */
export function addToBasket(variety: VarietySummary): boolean {
  if (basketEntries().some((entry) => entry.id === variety.id)) return false
  useBasketStore.setState({ entries: [...basketEntries(), { id: variety.id, verdict: variety.verdict.kind, on: variety.surveyedOn }] })
  return true
}

export function removeFromBasket(id: string): void {
  useBasketStore.setState({ entries: basketEntries().filter((entry) => entry.id !== id) })
}

export function clearBasket(): void {
  useBasketStore.setState({ entries: [] })
}

/** 기기에 저장된 목록을 불러온다(PriceStores가 마운트 뒤 한 번). */
export function rehydrateBasket(): Promise<void> | void {
  return useBasketStore.persist.rehydrate()
}

export function useBasketEntries(): readonly BasketEntry[] {
  return useBasketStore((state) => state.entries)
}

/** 그 품종을 담았는지. */
export function useInBasket(id: string): boolean {
  return useBasketStore((state) => state.entries.some((entry) => entry.id === id))
}

/** 담은 개수. */
export function useBasketCount(): number {
  return useBasketStore((state) => state.entries.length)
}

/** 기기 저장 값을 불러왔는지. 불러오기 전에는 빈 목록이라 "아직 담은 품종이 없어요"를 그리지 않는다. */
export function useBasketHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useBasketStore.persist.onFinishHydration(onChange),
    () => useBasketStore.persist.hasHydrated(),
    () => false
  )
}
