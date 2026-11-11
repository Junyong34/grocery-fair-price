"use client"

import { useEatenIds } from "@/shared/eaten-store"
import { useSeoulToday } from "@/shared/today-context"

/** "먹은 k가지". 기록은 기기에, 연도는 브라우저에서 정해지므로 둘 다 준비되기 전에는 0이다. */
export function EatenInMonth({ ids }: { ids: readonly string[] }) {
  const today = useSeoulToday()
  const eaten = useEatenIds(today?.year ?? 0)
  if (!today) return 0
  return ids.filter((id) => eaten.has(id)).length
}
