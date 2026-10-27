"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { VarietySummary, VerdictKind } from "@workspace/price/types"

// 담은 품종(P4): 담은 순서와, 담을 때의 판정 · 그 판정의 조사일. 기기(localStorage)에 저장한다.
// 담을 때 판정을 남겨 "10/16에 담을 때 보통 → 지금 싸요"를 보여 준다. 날짜는 시계가 아니라 그 판정의 조사일이다.
// skipHydration이라 서버 HTML과 첫 렌더는 빈 목록이고, PriceStores가 마운트 뒤 불러온다.

export type BasketEntry = {
  id: string
  /** 담을 때의 판정 */
  verdict: VerdictKind
  /** 담을 때 판정의 조사일 */
  on: string
}

type BasketState = {
  entries: readonly BasketEntry[]
  add: (variety: VarietySummary) => void
  remove: (id: string) => void
}

export const useBasketStore = create<BasketState>()(
  persist(
    (set) => ({
      entries: [],
      add: (variety) =>
        set((state) =>
          state.entries.some((entry) => entry.id === variety.id)
            ? state
            : { entries: [...state.entries, { id: variety.id, verdict: variety.verdict.kind, on: variety.surveyedOn }] }
        ),
      remove: (id) => set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) })),
    }),
    { name: "price:basket", version: 1, skipHydration: true }
  )
)

/** 그 품종을 담았는지. */
export function useInBasket(id: string): boolean {
  return useBasketStore((state) => state.entries.some((entry) => entry.id === id))
}
