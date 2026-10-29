"use client"

import { deviceStore } from "@/shared/device-store"

// "A3도 원해요"를 누른 에디션. 같은 기기에서 두 번 세지 않으려고 저장한다(.scratch/calendar-download 08).
const a3RequestStore = deviceStore<{ ids: string[] }>("seasonal:a3-requests", { ids: [] })

export const useA3Requested = (id: string) => a3RequestStore.use((state) => state.ids.includes(id))

/** 처음 누를 때만 true. 이벤트(08)는 true일 때만 보낸다. */
export function requestA3(id: string): boolean {
  if (a3RequestStore.get().ids.includes(id)) return false
  a3RequestStore.set((state) => ({ ids: [...state.ids, id] }))
  return true
}
