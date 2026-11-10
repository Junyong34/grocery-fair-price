import { Suspense } from "react"

import { FruitsDashboard } from "@/features/baby-food/fruits/fruits-dashboard"
import { EditionCard } from "@/shared/downloads/downloads-card"
import { getSeoulToday } from "@/shared/today"

/**
 * 도감은 레이아웃에 둔다. 월령을 바꾸면 페이지(메타데이터·구조화 데이터)만 바뀌고 도감은 그대로 남아,
 * 오늘 날짜를 다시 기다리며 빈 화면으로 깜빡이지 않는다. 고른 월령은 도감이 주소의 세그먼트로 읽는다.
 */
export default function FruitsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={<div className="min-h-svh" aria-busy />}>
        <FruitsContent />
      </Suspense>
    </>
  )
}

async function FruitsContent() {
  const today = await getSeoulToday()
  return (
    <FruitsDashboard
      currentMonth={today.month}
      download={<EditionCard kind="baby-food-fruits" placement="baby-food-fruits" />}
    />
  )
}
