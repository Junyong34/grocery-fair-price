"use client"

import { useRouter } from "next/navigation"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"

export function FoodSheet({ id }: { id: string }) {
  const router = useRouter()
  return (
    <BottomSheet open onClose={() => router.back()} title={`품종 상세 · ${id}`}>
      <p className="text-sm text-stone">와이어프레임 1i 자리</p>
    </BottomSheet>
  )
}
