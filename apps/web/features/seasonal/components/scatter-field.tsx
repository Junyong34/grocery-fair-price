import type { Food } from "@workspace/seasonal/data/foods"
import {
  SCATTER_FRAMES,
  scatterLayout,
} from "@workspace/seasonal/layout/scatter"

import { DraggableScatter } from "./draggable-scatter"

/**
 * 흩어진 품종 그림(명세 3.1 ①). 시드 배치는 서버에서 계산해 첫 화면에 그대로 보인다.
 * 그 위에서 그림을 끌어 옮길 수 있고, 옮긴 배치는 기기에 저장된다(DraggableScatter).
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
  frame: keyof typeof SCATTER_FRAMES
  year: number
  className?: string
}) {
  const seed = scatterLayout({
    month,
    ids: foods.map((food) => food.id),
    frame: SCATTER_FRAMES[frame],
  })
  return (
    <DraggableScatter
      month={month}
      frame={frame}
      seed={seed}
      foods={foods}
      year={year}
      className={className}
    />
  )
}
