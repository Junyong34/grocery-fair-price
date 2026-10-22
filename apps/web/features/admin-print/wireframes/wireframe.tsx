import { cn } from "@workspace/ui/lib/utils"

import type { WireframeEntry } from "../lib/wireframe-catalog"
import { sheetOf, type BarTone, type Orientation, type Shape } from "../lib/wireframe-shapes"

// 와이어프레임 한 장(용지 하나)을 SVG로 그린다. 좌표는 mm라 viewBox가 용지 크기이고, 선은 크기와 상관없이 1px(non-scaling-stroke)이다.
// 색이 없는 회색 그림이라 토큰은 회색 계열만 쓴다. 옵션 고르기의 미리보기 칸에 그대로 넣을 수 있게 폭만 부모를 따른다.

const BAR_FILL: Record<BarTone, string> = {
  text: "var(--color-mute)",
  strong: "var(--color-ash)",
  day: "var(--color-ash)",
  holiday: "var(--color-ink)",
  period: "var(--color-ash)",
  faint: "var(--color-hairline)",
}
const LINE_STROKE = { faint: "var(--color-hairline)", strong: "var(--color-ash)" } as const
const LABEL = {
  strong: { fill: "var(--color-ash)", className: "font-heading font-bold" },
  soft: { fill: "var(--color-silver)", className: "font-heading font-bold" },
  small: { fill: "var(--color-caption)", className: "font-sans" },
} as const

const stroke = { vectorEffect: "non-scaling-stroke", strokeWidth: 1 } as const

export function Wireframe({ entry, orientation, className }: { entry: WireframeEntry; orientation: Orientation; className?: string }) {
  const { width, height } = sheetOf(orientation)
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${entry.code} ${entry.title} (${orientation === "portrait" ? "세로" : "가로"})`}
      className={cn("block h-auto w-full", className)}
    >
      <rect width={width} height={height} fill="var(--color-surface)" stroke="var(--color-silver)" {...stroke} />
      {entry.draw(orientation).map((shape, i) => (
        <ShapeView key={i} shape={shape} />
      ))}
    </svg>
  )
}

function ShapeView({ shape }: { shape: Shape }) {
  switch (shape.type) {
    case "picture": {
      const { x, y, width, height } = shape.box
      if (shape.round) {
        const r = width / 2
        const d = r * Math.SQRT1_2
        const [cx, cy] = [x + r, y + r]
        return (
          <g stroke="var(--color-silver)" {...stroke}>
            <circle cx={cx} cy={cy} r={r} fill="var(--color-hairline)" />
            <path d={`M${cx - d} ${cy - d}L${cx + d} ${cy + d}M${cx + d} ${cy - d}L${cx - d} ${cy + d}`} />
          </g>
        )
      }
      return (
        <g stroke="var(--color-silver)" {...stroke}>
          <rect x={x} y={y} width={width} height={height} rx={Math.min(width, height) * 0.08} fill="var(--color-hairline)" />
          <path d={`M${x} ${y}L${x + width} ${y + height}M${x + width} ${y}L${x} ${y + height}`} />
        </g>
      )
    }
    case "bar":
      return <rect {...shape.box} rx={Math.min(shape.box.height / 2, 0.6)} fill={BAR_FILL[shape.tone]} />
    case "line":
      return <line x1={shape.from[0]} y1={shape.from[1]} x2={shape.to[0]} y2={shape.to[1]} stroke={shape.tone ? LINE_STROKE[shape.tone] : "var(--color-silver)"} {...stroke} />
    case "frame":
      return <rect {...shape.box} rx={1.5} fill={shape.fill ? "var(--color-surface)" : "none"} stroke="var(--color-silver)" {...stroke} />
    case "check":
      return <rect {...shape.box} rx={0.3} fill="none" stroke="var(--color-ash)" {...stroke} />
    case "ring":
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill ? "var(--color-surface)" : "none"} stroke="var(--color-ash)" {...stroke} />
    case "label": {
      const look = LABEL[shape.tone ?? "small"]
      return (
        <text x={shape.x} y={shape.y} fontSize={shape.size} dominantBaseline="hanging" textAnchor={shape.anchor ?? "start"} fill={look.fill} className={look.className}>
          {shape.text}
        </text>
      )
    }
  }
}
