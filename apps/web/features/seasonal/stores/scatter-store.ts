"use client"

import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { SavedSpot } from "@workspace/seasonal/layout/merge-saved"

// 2a 흩어진 그림을 사용자가 옮긴 배치. (달, 화면 구간)마다 따로 기기에 저장한다.
// 히어로와 그 달 섹션은 같은 키를 쓰므로 한쪽에서 옮기면 다른 쪽도 같이 바뀐다.
type ScatterState = {
  layouts: Record<string, readonly SavedSpot[]>
  save: (key: string, spots: readonly SavedSpot[]) => void
  reset: (key: string) => void
}

export const scatterKey = (month: number, frame: string) => `${month}:${frame}`

export const useScatterStore = create<ScatterState>()(
  persist(
    (set) => ({
      layouts: {},
      save: (key, spots) =>
        set((state) => ({ layouts: { ...state.layouts, [key]: spots } })),
      reset: (key) =>
        set((state) => {
          const { [key]: _removed, ...rest } = state.layouts
          return { layouts: rest }
        }),
    }),
    { name: "seasonal:scatter", version: 1, skipHydration: true }
  )
)

let hydrating = false
/** 기기에 저장된 배치를 하이드레이션 뒤 한 번 불러온다. 서버 HTML은 시드 배치다. */
export function useHydrateScatter() {
  useEffect(() => {
    if (hydrating) return
    hydrating = true
    void useScatterStore.persist.rehydrate()
  }, [])
}
