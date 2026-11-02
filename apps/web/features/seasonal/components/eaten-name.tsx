"use client"

import { cn } from "@workspace/ui/lib/utils"

import { useIsEaten } from "@/shared/eaten-store"

/** 달력과 같은 금색 밑줄로 그해 먹은 품종을 표시한다. */
export function EatenName({ year, foodId, children }: { year: number; foodId: string; children: React.ReactNode }) {
  const eaten = useIsEaten(year, foodId)
  return (
    <>
      <span className={cn("relative isolate inline-block", eaten && "eaten-highlight")}>{children}</span>
      {eaten && <span className="sr-only"> 먹음</span>}
    </>
  )
}
