"use client"

import { Suspense } from "react"

import { useEatenIds } from "@/shared/eaten-store"
import { useToday } from "@/shared/today-context"

/** "먹은 k가지". 기록은 기기에, 연도는 요청 시점에 정해지므로 둘 다 준비된 뒤 숫자가 나온다. */
export function EatenInMonth({ ids }: { ids: readonly string[] }) {
  return (
    <Suspense fallback="0">
      <Count ids={ids} />
    </Suspense>
  )
}

function Count({ ids }: { ids: readonly string[] }) {
  const { year } = useToday()
  const eaten = useEatenIds(year)
  return ids.filter((id) => eaten.has(id)).length
}
