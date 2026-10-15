"use client"

import { Suspense } from "react"

import { useToday } from "@/shared/today-context"

/** 이번 달(서울 기준 오늘)이면 "이번 달" 태그. 오늘은 요청 시점 값이라 Suspense 안에서 읽는다. */
export function ThisMonthTag({ month }: { month: number }) {
  return (
    <Suspense>
      <Tag month={month} />
    </Suspense>
  )
}

function Tag({ month }: { month: number }) {
  const today = useToday()
  if (today.month !== month) return null
  return (
    <span className="shrink-0 rounded-[3px] border border-gold bg-gold-wash px-1.5 py-0.5 text-[11px] text-gold-deep">
      이번 달
    </span>
  )
}
