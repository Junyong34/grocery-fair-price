import type { Food } from "@workspace/seasonal/data/foods"

import { t, u } from "./units"

/**
 * 품종 그림 하나와 이름. 화면의 FoodImage(next/image, 지연 로딩)를 쓰지 않는다.
 * PDF는 그림이 모두 들어온 뒤 저장해야 하고, SVG를 그대로 넣어야 A3에서도 벡터로 남는다.
 */
export function FoodFigure({
  food,
  size,
  nameSize,
  showName,
  style,
}: {
  food: Food
  /** 그림 한 변(용지 단위) */
  size: number
  nameSize: number
  showName: boolean
  style?: React.CSSProperties
}) {
  return (
    <figure className="print-food" style={{ width: u(size), margin: 0, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 인쇄는 지연 로딩 없이 원본 SVG를 넣는다 */}
      <img src={`/foods/${food.id}/color.svg`} alt={food.name} loading="eager" decoding="sync" />
      {showName && (
        <figcaption className="print-food-name" style={{ fontSize: t(nameSize), marginTop: u(nameSize * 0.2) }}>
          {food.name}
        </figcaption>
      )}
    </figure>
  )
}
