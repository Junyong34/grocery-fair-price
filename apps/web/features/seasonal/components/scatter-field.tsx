import Link from "next/link"

import type { Food } from "@workspace/seasonal/data/foods"
import { scatterLayout, type ScatterFrame } from "@workspace/seasonal/layout/scatter"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { EatenBadge } from "./eaten-badge"
import { FoodImage } from "./food-image"

/**
 * 흩어진 품종 그림(명세 3.1 ①). 배치는 시드 고정이라 서버에서 계산하고, 화면 폭에 맞춰 비율로 확대·축소만 한다.
 * 그림을 누르면 품종 상세로 간다. 먹음 ✓는 설정(data-eaten-mark=off)으로 숨길 수 있다.
 */
export function ScatterField({
  month,
  foods,
  frame,
  year,
  className,
}: {
  month: number
  foods: readonly Food[]
  frame: ScatterFrame
  year: number
  className?: string
}) {
  const layout = scatterLayout({ month, ids: foods.map((food) => food.id), frame })
  const byId = new Map<string, Food>(foods.map((food) => [food.id, food]))
  return (
    <div className={cn("@container relative w-full", className)} style={{ aspectRatio: layout.aspect }}>
      {layout.items.map((item) => {
        const food = byId.get(item.id)!
        const px = item.size * frame.width
        // 라벨 크기: 그림이 크면 크게(명세 3.1). 기준 px를 프레임 폭 비율(cqi)로 바꿔 함께 확대·축소한다.
        const labelPx = px > 90 ? 15 : px > 55 ? 12 : 10
        return (
          <Link
            key={item.id}
            href={routes.seasonal.food(item.id)}
            className="absolute block text-ink no-underline hover:text-ink"
            style={{
              left: `${(item.cx - item.size / 2) * 100}%`,
              top: `${(item.cy - (item.size * layout.aspect) / 2) * 100}%`,
              width: `${item.size * 100}%`,
              zIndex: item.z,
              rotate: `${item.rotate}deg`,
            }}
          >
            <span className="relative block">
              <FoodImage food={food} sizes={`${Math.round(px * 1.5)}px`} showName={false} />
              <EatenBadge year={year} foodId={food.id} className="in-data-[eaten-mark=off]:hidden" />
            </span>
            <span
              className="block text-center leading-tight font-semibold whitespace-nowrap"
              style={{ fontSize: `${(labelPx / frame.width) * 100}cqi` }}
            >
              {food.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
