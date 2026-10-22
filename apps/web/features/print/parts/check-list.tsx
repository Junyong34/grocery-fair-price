import type { Food } from "@workspace/seasonal/data/foods"

import { t, u } from "./units"

/** 품종 이름 옆에 손으로 체크할 빈 칸. 월간 달력의 먹은 음식 체크와 월별 포스터의 장보기 체크가 쓴다. */
export function CheckList({
  foods,
  columns,
  fontSize,
  lineHeight = 1.6,
  style,
}: {
  foods: readonly Food[]
  columns: number
  /** 글자 크기(용지 단위). 체크 칸과 간격이 이 값에 비례한다. */
  fontSize: number
  /** 한 줄 높이(글자 크기 배) */
  lineHeight?: number
  style?: React.CSSProperties
}) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", columns, columnGap: u(4), fontSize: t(fontSize), ...style }}>
      {foods.map((food) => (
        <li key={food.id} style={{ display: "flex", alignItems: "center", gap: u(fontSize * 0.43), lineHeight, breakInside: "avoid" }}>
          <span style={{ width: u(fontSize * 0.93), height: u(fontSize * 0.93), border: "var(--line) solid var(--color-stone)", borderRadius: u(0.5), flex: "none" }} />
          {food.name}
        </li>
      ))}
    </ul>
  )
}
