"use client"

import type { SavedSpot } from "@workspace/seasonal/layout/arrangement"

import { deviceStore } from "@/shared/device-store"

// 2a 흩어진 그림을 사용자가 옮긴 배치. (달, 화면 구간)마다 따로 기기에 저장한다.
// 히어로와 그 달 섹션은 같은 키를 쓰므로 한쪽에서 옮기면 다른 쪽도 같이 바뀐다.
/** 판 위 달력의 왼쪽 위 자리(판 크기 대비 0..1). */
export type CalendarSpot = { x: number; y: number }

type ScatterState = {
  layouts: Record<string, readonly SavedSpot[]>
  /** 달력을 옮긴 자리. 데스크톱 달 판만 쓴다. */
  calendars: Record<string, CalendarSpot>
}

export const scatterKey = (month: number, frame: string) => `${month}:${frame}`

const scatterStore = deviceStore<ScatterState>("seasonal:scatter", { layouts: {}, calendars: {} })

/** 그 판에 옮겨 둔 그림 배치. 옮긴 적이 없으면 undefined. */
export function useSavedSpots(key: string): readonly SavedSpot[] | undefined {
  return scatterStore.use((state) => state.layouts[key])
}

/** 그 판에 옮겨 둔 달력 자리. */
export function useSavedCalendar(key: string): CalendarSpot | undefined {
  return scatterStore.use((state) => state.calendars?.[key])
}

export function saveSpots(key: string, spots: readonly SavedSpot[]): void {
  scatterStore.set((state) => ({ layouts: { ...state.layouts, [key]: spots } }))
}

export function saveCalendar(key: string, spot: CalendarSpot): void {
  scatterStore.set((state) => ({ calendars: { ...state.calendars, [key]: spot } }))
}

/** 그림과 달력을 모두 처음 자리로 되돌린다. */
export function resetScatter(key: string): void {
  scatterStore.set((state) => {
    const { [key]: _layout, ...layouts } = state.layouts
    const { [key]: _calendar, ...calendars } = state.calendars ?? {}
    return { layouts, calendars }
  })
}
