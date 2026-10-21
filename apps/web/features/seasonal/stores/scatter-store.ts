"use client"

import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { SavedSpot } from "@workspace/seasonal/layout/arrangement"

// 2a 흩어진 그림을 사용자가 옮긴 배치. (달, 화면 구간)마다 따로 기기에 저장한다.
// 히어로와 그 달 섹션은 같은 키를 쓰므로 한쪽에서 옮기면 다른 쪽도 같이 바뀐다.
/** 판 위 달력의 왼쪽 위 자리(판 크기 대비 0..1). */
export type CalendarSpot = { x: number; y: number }

type ScatterState = {
  layouts: Record<string, readonly SavedSpot[]>
  /** 달력을 옮긴 자리. 데스크톱 달 판만 쓴다. */
  calendars: Record<string, CalendarSpot>
  save: (key: string, spots: readonly SavedSpot[]) => void
  saveCalendar: (key: string, spot: CalendarSpot) => void
  /** 그림과 달력을 모두 처음 자리로 되돌린다. */
  reset: (key: string) => void
}

export const scatterKey = (month: number, frame: string) => `${month}:${frame}`

export const useScatterStore = create<ScatterState>()(
  persist(
    (set) => ({
      layouts: {},
      calendars: {},
      save: (key, spots) =>
        set((state) => ({ layouts: { ...state.layouts, [key]: spots } })),
      saveCalendar: (key, spot) =>
        set((state) => ({ calendars: { ...state.calendars, [key]: spot } })),
      reset: (key) =>
        set((state) => {
          const { [key]: _layout, ...layouts } = state.layouts
          const { [key]: _calendar, ...calendars } = state.calendars ?? {}
          return { layouts, calendars }
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
