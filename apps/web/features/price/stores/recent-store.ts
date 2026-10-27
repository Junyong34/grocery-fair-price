"use client"

import { deviceStore } from "@/shared/device-store"

// 최근 본 품종(P1 · P2): 품종 상세를 연 순서, 최근 것이 앞. 기기(localStorage)에 저장한다.
// 서버 HTML과 첫 렌더는 빈 목록이고, 저장값은 마운트 뒤 불러온다(device-store).

const LIMIT = 8

const recentStore = deviceStore<{ ids: readonly string[] }>("price:recent", { ids: [] })

/** 품종 상세를 열면 맨 앞에 넣는다. */
export function visitVariety(id: string): void {
  recentStore.set(({ ids }) => ({ ids: [id, ...ids.filter((other) => other !== id)].slice(0, LIMIT) }))
}

export function clearRecent(): void {
  recentStore.set({ ids: [] })
}

export function useRecentIds(): readonly string[] {
  return recentStore.use((state) => state.ids)
}
