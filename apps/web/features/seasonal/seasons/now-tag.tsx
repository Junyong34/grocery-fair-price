"use client"

import { Suspense } from "react"

import { seasonOfMonth, type Season } from "@workspace/seasonal/data/seasons"

import { useToday } from "@/shared/today-context"

/** 지금(서울 기준 오늘) 계절이면 "지금 계절" 태그. 오늘은 요청 시점 값이라 Suspense 안에서 읽는다. */
export function NowTag({ season }: { season: Season }) {
  return (
    <Suspense>
      <Tag season={season} />
    </Suspense>
  )
}

function Tag({ season }: { season: Season }) {
  const { month } = useToday()
  if (seasonOfMonth(month) !== season) return null
  return (
    <span className="shrink-0 rounded-[3px] border border-gold bg-gold-wash px-2 py-0.5 text-[11px] tracking-normal text-gold-deep">
      지금<span className="hidden @[300px]:inline"> 계절</span>
    </span>
  )
}
