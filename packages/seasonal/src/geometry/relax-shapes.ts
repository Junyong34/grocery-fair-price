// "원 + 아래 이름표(직사각형)" 묶음끼리 겹치지 않게 밀어내는 완화. 시드 배치와 끌어 옮기기(layout/arrangement)가 같이 쓴다.
// 그림은 원, 이름은 그 원 바로 아래에 가로로 놓이는 직사각형이다. 원·원, 원·직사각형, 직사각형·직사각형을 모두 푼다.
// DOM·React와 무관한 순수 함수이며 같은 입력이면 같은 결과가 나온다.

export type Shape = {
  id: string
  /** 원 중심 */
  x: number
  y: number
  /** 원 반지름 */
  r: number
  /** 이름표 폭·높이. 이름표는 원 바로 아래(원 중심 x 기준 가운데)에 놓인다. */
  labelW: number
  labelH: number
}

export type RelaxShapesOptions = {
  /** 전체가 머물 영역(0..width, 0..height). 원과 이름표가 모두 이 안에 남는다. */
  bounds: { width: number; height: number }
  /** 움직이지 않을 묶음(끄는 중인 그림). 겹침은 상대가 전부 비켜서 푼다. */
  pinned?: string
  /** 묶음 사이에 남길 틈. */
  gap?: number
  iterations?: number
}

type Rect = { cx: number; cy: number; w: number; h: number }

const labelRect = (s: Shape): Rect => ({ cx: s.x, cy: s.y + s.r + s.labelH / 2, w: s.labelW, h: s.labelH })

/** 겹친 묶음을 서로 밀어낸 새 배열을 돌려준다. 입력은 바꾸지 않는다. */
export function relaxShapes(shapes: readonly Shape[], { bounds, pinned, gap = 0, iterations = 60 }: RelaxShapesOptions): Shape[] {
  const next = shapes.map((shape) => ({ ...shape }))
  for (let step = 0; step < iterations; step++) {
    let moved = false
    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        const push = separation(next[i]!, next[j]!, gap)
        if (!push) continue
        moved = true
        const [a, b] = next[i]!.id === pinned ? [0, 1] : next[j]!.id === pinned ? [1, 0] : [0.5, 0.5]
        next[i]!.x -= push.x * a
        next[i]!.y -= push.y * a
        next[j]!.x += push.x * b
        next[j]!.y += push.y * b
      }
    }
    for (const shape of next) clamp(shape, bounds)
    if (!moved) break
  }
  return next
}

/**
 * 두 묶음이 겹친 깊이(겹치지 않으면 0). 원·원, 원·이름표, 이름표·이름표 중 가장 깊은 겹침이다.
 * 방향은 따로 두 묶음의 중심을 잇는 선으로 정한다. 겹침마다 방향을 따로 정하면 서로 다른 방향으로 밀려 제자리를 맴돈다.
 */
function depth(a: Shape, b: Shape, gap: number): number {
  const ra = labelRect(a)
  const rb = labelRect(b)
  return Math.max(
    a.r + b.r + gap - Math.hypot(b.x - a.x, b.y - a.y),
    circleRectDepth(a.x, a.y, a.r, rb, gap),
    circleRectDepth(b.x, b.y, b.r, ra, gap),
    rectRectDepth(ra, rb, gap),
    0
  )
}

/** 원과 이름표를 함께 감싸는 상자의 중심. 이 점들을 잇는 선이 밀어내는 방향이다. */
const centroid = (s: Shape) => ({ x: s.x, y: s.y + s.labelH / 2 })

function separation(a: Shape, b: Shape, gap: number): { x: number; y: number } | null {
  const overlap = depth(a, b, gap)
  if (overlap <= 0) return null
  const ca = centroid(a)
  const cb = centroid(b)
  const dx = cb.x - ca.x
  const dy = cb.y - ca.y
  const distance = Math.hypot(dx, dy)
  // 중심이 같으면 방향이 없으므로 오른쪽으로 민다.
  return distance > 0 ? { x: (dx / distance) * overlap, y: (dy / distance) * overlap } : { x: overlap, y: 0 }
}

function circleRectDepth(cx: number, cy: number, r: number, rect: Rect, gap: number): number {
  const nearestX = Math.min(Math.max(cx, rect.cx - rect.w / 2), rect.cx + rect.w / 2)
  const nearestY = Math.min(Math.max(cy, rect.cy - rect.h / 2), rect.cy + rect.h / 2)
  return r + gap - Math.hypot(nearestX - cx, nearestY - cy)
}

function rectRectDepth(a: Rect, b: Rect, gap: number): number {
  const overlapX = (a.w + b.w) / 2 + gap - Math.abs(b.cx - a.cx)
  const overlapY = (a.h + b.h) / 2 + gap - Math.abs(b.cy - a.cy)
  return overlapX > 0 && overlapY > 0 ? Math.min(overlapX, overlapY) : 0
}

function clamp(shape: Shape, { width, height }: RelaxShapesOptions["bounds"]) {
  const half = Math.max(shape.r, shape.labelW / 2)
  shape.x = Math.min(Math.max(shape.x, half), width - half)
  shape.y = Math.min(Math.max(shape.y, shape.r), height - shape.r - shape.labelH)
}
