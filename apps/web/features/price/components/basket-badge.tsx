"use client"

import { Badge } from "@workspace/ui/components/badge"

import { useBasketCount } from "../stores/basket-store"

/** 하단 내비 · 헤더 "담은 품종" 칸의 개수. 0이면 숨긴다. */
export function BasketBadge() {
  const count = useBasketCount()
  if (!count) return null
  return (
    <Badge variant="count" aria-label={`${count}개`} className="h-[18px] min-w-[18px] px-1 text-[10px]">
      {count}
    </Badge>
  )
}
