"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// 최근 본 품종(P1 · P2): 품종 상세를 연 순서, 최근 것이 앞. 기기(localStorage)에 저장한다.
// skipHydration이라 서버 HTML과 첫 렌더는 빈 목록이고, PriceStores가 마운트 뒤 불러온다.

const LIMIT = 8

type RecentState = {
  ids: readonly string[]
  visit: (id: string) => void
  clear: () => void
}

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      ids: [],
      visit: (id) => set((state) => ({ ids: [id, ...state.ids.filter((other) => other !== id)].slice(0, LIMIT) })),
      clear: () => set({ ids: [] }),
    }),
    { name: "price:recent", version: 1, skipHydration: true }
  )
)
