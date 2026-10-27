"use client"

import { useMemo } from "react"

import { renameFoodIds } from "@workspace/seasonal/data/renamed-foods"

import { deviceStore } from "./device-store"

// 먹음 기록(GLOSSARY): 사용자가 어떤 품종을 그해 먹었다고 표시한 것. 연도마다 따로 쌓인다.
// 기기(localStorage)에 저장한다(device-store). 서버 HTML에는 기록이 없어 ✓와 개수는 하이드레이션 뒤에 나타난다.
// "올해"는 서버가 계산한 서울 기준 연도를 받아 쓴다(렌더 중에 new Date()를 부르지 않는다).

type EatenState = {
  /** 연도 → 먹은 품종 id 목록 */
  byYear: Record<string, readonly string[]>
}

const NONE: readonly string[] = []

const eatenStore = deviceStore<EatenState>(
  "seasonal:eaten",
  { byYear: {} },
  {
    version: 2,
    // 1 → 2: 품종 id 9개가 바뀌었다(renamed-foods). 옛 id로 남은 기록을 새 id로 옮긴다.
    migrate: (persisted, version) => {
      const state = persisted as EatenState
      if (version >= 2) return state
      return { byYear: Object.fromEntries(Object.entries(state.byYear ?? {}).map(([year, ids]) => [year, renameFoodIds(ids)])) }
    },
  }
)

/** 그해 먹음을 켜거나 끈다. */
export function toggleEaten(year: number, foodId: string): void {
  eatenStore.set((state) => {
    const ids = state.byYear[year] ?? NONE
    const next = ids.includes(foodId) ? ids.filter((id) => id !== foodId) : [...ids, foodId]
    return { byYear: { ...state.byYear, [year]: next } }
  })
}

/** 그해 먹은 품종 id 집합. */
export function useEatenIds(year: number): ReadonlySet<string> {
  const ids = eatenStore.use((state) => state.byYear[year] ?? NONE)
  return useMemo(() => new Set(ids), [ids])
}

/** 그 품종을 그해 먹었는지. */
export function useIsEaten(year: number, foodId: string): boolean {
  return eatenStore.use((state) => (state.byYear[year] ?? NONE).includes(foodId))
}
