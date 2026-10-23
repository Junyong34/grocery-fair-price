"use client"

import { useMemo } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { renameFoodIds } from "@workspace/seasonal/data/renamed-foods"

// 먹음 기록(GLOSSARY): 사용자가 어떤 품종을 그해 먹었다고 표시한 것. 연도마다 따로 쌓인다.
// 기기(localStorage)에 저장한다. 서버 HTML에는 기록이 없으므로 skipHydration으로 두고
// Providers가 마운트된 뒤 다시 불러온다. 그래서 ✓와 개수는 하이드레이션 뒤에 나타난다.
// "올해"는 서버가 계산한 서울 기준 연도를 받아 쓴다(렌더 중에 new Date()를 부르지 않는다).

type EatenState = {
  /** 연도 → 먹은 품종 id 목록 */
  byYear: Record<string, readonly string[]>
  toggle: (year: number, foodId: string) => void
}

const NONE: readonly string[] = []

export const useEatenStore = create<EatenState>()(
  persist(
    (set) => ({
      byYear: {},
      toggle: (year, foodId) =>
        set((state) => {
          const ids = state.byYear[year] ?? NONE
          const next = ids.includes(foodId) ? ids.filter((id) => id !== foodId) : [...ids, foodId]
          return { byYear: { ...state.byYear, [year]: next } }
        }),
    }),
    {
      name: "seasonal:eaten",
      version: 2,
      skipHydration: true,
      // 1 → 2: 품종 id 9개가 바뀌었다(renamed-foods). 옛 id로 남은 기록을 새 id로 옮긴다.
      migrate: (persisted, version) => {
        const state = persisted as Pick<EatenState, "byYear">
        if (version >= 2) return state
        return { byYear: Object.fromEntries(Object.entries(state.byYear ?? {}).map(([year, ids]) => [year, renameFoodIds(ids)])) }
      },
    },
  ),
)

/** 그해 먹은 품종 id 집합. */
export function useEatenIds(year: number): ReadonlySet<string> {
  const ids = useEatenStore((state) => state.byYear[year] ?? NONE)
  return useMemo(() => new Set(ids), [ids])
}

/** 그 품종을 그해 먹었는지. */
export function useIsEaten(year: number, foodId: string): boolean {
  return useEatenStore((state) => (state.byYear[year] ?? NONE).includes(foodId))
}
