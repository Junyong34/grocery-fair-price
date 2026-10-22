import type { Food } from "@workspace/seasonal/data/foods"
import type { WheelLayout } from "@workspace/seasonal/print/wheel"

import { FoodFigure } from "./food-figure"
import { t, u } from "./units"

export type WheelItem = {
  foods: readonly Food[]
  /** 바깥 띠에 적는 표기(달·계절 이름) */
  label: string
  /** 표기 글자색 */
  color: string
  /** 부채꼴 바탕. 없으면 칠하지 않는다. */
  fill?: string
}

/**
 * 원형 판. 자리 계산은 @workspace/seasonal/print/wheel의 wheelLayout이 하고, 여기서는 부채꼴(SVG)과 그림·표기를 그 자리에 놓는다.
 * items는 layout.sectors와 같은 차례(12시 방향부터 시계 방향)다. children은 가운데 빈 원 안에 놓는다.
 */
export function Wheel({ layout, items, labelSize, children }: { layout: WheelLayout; items: readonly WheelItem[]; labelSize: number; children?: React.ReactNode }) {
  const { diameter: d, inner, pictureSize, sectors } = layout
  const c = d / 2
  const at = (angle: number, r: number) => `${c + r * Math.sin(angle)} ${c - r * Math.cos(angle)}`
  return (
    <div className="print-wheel" style={{ width: u(d), height: u(d) }}>
      <svg viewBox={`0 0 ${d} ${d}`} aria-hidden>
        {sectors.map((sector, i) => (
          <path
            key={i}
            d={`M ${c} ${c} L ${at(sector.start, c)} A ${c} ${c} 0 0 1 ${at(sector.end, c)} Z`}
            fill={items[i]?.fill ?? "none"}
          />
        ))}
        <circle cx={c} cy={c} r={c} fill="none" />
        <circle cx={c} cy={c} r={inner} className="print-wheel-core" />
      </svg>
      {sectors.map((sector, i) => (
        <span key={`label-${i}`} className="print-wheel-label print-heading" style={{ left: u(sector.label.x), top: u(sector.label.y), fontSize: t(labelSize), color: items[i]?.color }}>
          {items[i]?.label}
        </span>
      ))}
      {sectors.flatMap((sector, i) =>
        sector.slots.map((slot, j) => {
          const food = items[i]?.foods[j]
          return (
            food && (
              <FoodFigure
                key={`${i}-${food.id}`}
                food={food}
                size={pictureSize}
                nameSize={0}
                showName={false}
                style={{ left: u(slot.x - pictureSize / 2), top: u(slot.y - pictureSize / 2) }}
              />
            )
          )
        }),
      )}
      <div className="print-wheel-center" style={{ width: u(inner * 2), height: u(inner * 2), left: u(c - inner), top: u(c - inner) }}>
        {children}
      </div>
    </div>
  )
}
