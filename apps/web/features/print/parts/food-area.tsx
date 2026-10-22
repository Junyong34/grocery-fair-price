import type { Food } from "@workspace/seasonal/data/foods"
import { labelFontPx, scatterLayout, type ScatterFrame } from "@workspace/seasonal/layout/scatter"

import { FoodFigure } from "./food-figure"
import { u } from "./units"

/** 배치 계산의 기준 프레임은 용지 단위 1당 4px이다. 이름표 크기(14px)가 3.5 단위가 된다. */
const PX_PER_UNIT = 4

/**
 * 정해진 크기(용지 단위)의 판에 품종 그림을 놓는다.
 * scatter는 화면 2a와 같은 시드 배치(달·품종·판 크기가 같으면 늘 같은 자리), flow는 줄 맞춰 고르게 채운다.
 */
export function FoodArea({
  foods,
  width,
  height,
  layout,
  month,
  showName,
  nameSize,
  maxSize,
  avoid,
  style,
}: {
  foods: readonly Food[]
  width: number
  height: number
  layout: "scatter" | "flow"
  /** scatter 시드에 쓰는 칸 번호(달 1~12, 계절은 13~16) */
  month: number
  showName: boolean
  /** flow의 이름 글자 크기(용지 단위). scatter는 배치 계산이 정한 크기를 쓴다. */
  nameSize?: number
  /** flow 그림 크기 상한. 한 장의 여러 칸이 같은 크기로 보이게 할 때 준다(flowSize의 최솟값). */
  maxSize?: number
  /** scatter에서 그림을 놓지 않을 사각형(판 왼쪽 위 기준 용지 단위). 그 자리에 달력 블록 같은 것이 얹힌다. */
  avoid?: readonly { x: number; y: number; width: number; height: number }[]
  style?: React.CSSProperties
}) {
  const box = { position: "relative", width: u(width), height: u(height), flex: "none", ...style } as const
  if (foods.length === 0) return <div style={box} />

  if (layout === "scatter") {
    const frame: ScatterFrame = {
      width: width * PX_PER_UNIT,
      height: height * PX_PER_UNIT,
      big: true,
      avoid: avoid?.map((box) => ({ x: box.x * PX_PER_UNIT, y: box.y * PX_PER_UNIT, width: box.width * PX_PER_UNIT, height: box.height * PX_PER_UNIT })),
    }
    const { items } = scatterLayout({ month, ids: foods.map((food) => food.id), frame })
    const label = labelFontPx(frame) / PX_PER_UNIT
    return (
      <div style={box}>
        {items.map((item) => {
          const size = item.size * width
          return (
            <FoodFigure
              key={item.id}
              food={foods.find((food) => food.id === item.id)!}
              size={size}
              nameSize={label}
              showName={showName}
              style={{
                left: u(item.cx * width - size / 2),
                top: u(item.cy * height - size / 2),
                zIndex: item.z,
                transform: `rotate(${item.rotate}deg)`,
              }}
            />
          )
        })}
      </div>
    )
  }

  const best = flowGrid(foods.length, width, height, showName ? (nameSize ?? 3) : 0)
  const size = Math.min(best.size, maxSize ?? Infinity)
  const gap = Math.min(width / best.columns - size, size * 0.7)
  return (
    <div className="print-flow" style={{ ...box, columnGap: u(gap), rowGap: u(size * 0.08) }}>
      {foods.map((food) => (
        <FoodFigure key={food.id} food={food} size={size} nameSize={nameSize ?? 3} showName={showName} />
      ))}
    </div>
  )
}

/** flow로 n개를 놓을 때의 그림 크기. 여러 칸의 크기를 맞출 때 최솟값을 maxSize로 넘긴다. */
export function flowSize(n: number, width: number, height: number, nameSize: number): number {
  return flowGrid(n, width, height, nameSize).size
}

/** n개를 판에 고르게 놓을 때 그림이 가장 커지는 열 수와 그림 크기. */
function flowGrid(n: number, width: number, height: number, nameSize: number) {
  const nameHeight = nameSize * 1.6
  let best = { columns: 1, size: 0 }
  for (let columns = 1; columns <= n; columns++) {
    const rows = Math.ceil(n / columns)
    const size = Math.min(width / columns, height / rows - nameHeight) * 0.78
    if (size > best.size) best = { columns, size }
  }
  return best
}
