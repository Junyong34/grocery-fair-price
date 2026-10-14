"use client"

import { Button } from "@workspace/ui/components/button"

import { useEatenStore, useIsEaten } from "@/shared/eaten-store"

export function EatToggle({ year, foodId }: { year: number; foodId: string }) {
  const eaten = useIsEaten(year, foodId)
  const toggle = useEatenStore((state) => state.toggle)
  return (
    <Button variant="outline" size="sm" aria-pressed={eaten} onClick={() => toggle(year, foodId)}>
      {eaten ? "✓ 먹었어요" : "먹었어요"}
    </Button>
  )
}
