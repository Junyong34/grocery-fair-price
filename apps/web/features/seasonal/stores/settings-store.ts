"use client"

import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

// 2a ⚙ 표시 설정(명세 4절, 24절기·다운로드 제외). 기기에 저장한다.
// 서버 HTML은 기본값(모두 켜짐)으로 그리고, 하이드레이션 뒤 저장값을 불러온다.
type SettingsState = {
  showHolidays: boolean
  showEaten: boolean
  set: (patch: Partial<Pick<SettingsState, "showHolidays" | "showEaten">>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showHolidays: true,
      showEaten: true,
      set: (patch) => set(patch),
    }),
    { name: "seasonal:settings", version: 1, skipHydration: true },
  ),
)

/** 제철 영역이 마운트되면 기기에 저장된 설정을 불러온다. */
export function useHydrateSettings() {
  useEffect(() => {
    void useSettingsStore.persist.rehydrate()
  }, [])
}
