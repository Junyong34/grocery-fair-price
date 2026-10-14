import { findFood } from "@workspace/seasonal/data/foods"
import { SEASONS } from "@workspace/seasonal/data/seasons"

import { EatenBadge } from "@/features/seasonal/components/eaten-badge"
import { FoodImage } from "@/features/seasonal/components/food-image"
import { SeasonMonthsBar } from "@/features/seasonal/components/season-months-bar"
import { SeasonTag } from "@/features/seasonal/components/season-tag"

import { EatToggle } from "./eat-toggle"

// 제철 공통 부품 확인용 페이지. 연도는 예시 값이다(실제 화면은 서버가 계산한 서울 기준 연도를 쓴다).
const YEAR = 2026
const SAMPLES = ["apple", "gizzard-shad", "persimmon", "watermelon"].map((id) => findFood(id)!)

export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 p-6">
      <h1 className="font-heading text-3xl">제철 공통 부품</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-stone">계절 태그</h2>
        <div className="flex gap-2">
          {SEASONS.map((season) => (
            <SeasonTag key={season} season={season} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-stone">품종 이미지 · 먹음 배지 · 12칸 막대 (사과·감은 그림, 전어·수박은 이름 카드)</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {SAMPLES.map((food) => (
            <div key={food.id} className="flex flex-col gap-2">
              <div className="relative">
                <FoodImage food={food} />
                <EatenBadge year={YEAR} foodId={food.id} />
              </div>
              <span className="font-semibold">{food.name}</span>
              <SeasonMonthsBar months={food.months} />
              <EatToggle year={YEAR} foodId={food.id} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-stone">서체</h2>
        <p className="font-heading text-4xl">가을 · 수확과 저장의 달</p>
        <p className="font-number text-7xl tabular-nums">10</p>
        <p>본문 Pretendard — 밤·고구마·사과, 거두어들이는 달</p>
      </section>
    </main>
  )
}
