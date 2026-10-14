// 원끼리 겹치지 않게 밀어내는 완화(relaxation) 계산. 끌어 옮기는 그림이 주변 그림을 비켜나게 할 때 쓴다.
// DOM·React와 무관한 순수 함수다.

export type Circle = { id: string; x: number; y: number; r: number }

export type RelaxOptions = {
  /** 원 전체가 머물 영역(0..width, 0..height). 밀려나도 이 안에 남는다. */
  bounds: { width: number; height: number }
  /** 움직이지 않을 원(끄는 중인 그림). */
  pinned?: string
  /** 원 사이에 남길 틈. */
  gap?: number
  /** 반복 횟수 상한. 한 프레임 안에 끝나도록 작게 둔다. */
  iterations?: number
}

/** 겹친 원을 서로 밀어낸 새 배열을 돌려준다. 입력은 바꾸지 않는다. */
export function relaxCircles(
  circles: readonly Circle[],
  { bounds, pinned, gap = 0, iterations = 8 }: RelaxOptions
): Circle[] {
  const next = circles.map((circle) => ({ ...circle }))
  for (let step = 0; step < iterations; step++) {
    let moved = false
    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        const a = next[i]!
        const b = next[j]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.hypot(dx, dy)
        const overlap = a.r + b.r + gap - distance
        if (overlap <= 0) continue
        moved = true
        // 중심이 겹치면 방향이 없으므로 오른쪽으로 민다.
        const ux = distance > 0 ? dx / distance : 1
        const uy = distance > 0 ? dy / distance : 0
        const share =
          a.id === pinned ? [0, 1] : b.id === pinned ? [1, 0] : [0.5, 0.5]
        a.x -= ux * overlap * share[0]!
        a.y -= uy * overlap * share[0]!
        b.x += ux * overlap * share[1]!
        b.y += uy * overlap * share[1]!
      }
    }
    for (const circle of next) clamp(circle, bounds)
    if (!moved) break
  }
  return next
}

function clamp(circle: Circle, { width, height }: RelaxOptions["bounds"]) {
  circle.x = Math.min(Math.max(circle.x, circle.r), width - circle.r)
  circle.y = Math.min(Math.max(circle.y, circle.r), height - circle.r)
}
