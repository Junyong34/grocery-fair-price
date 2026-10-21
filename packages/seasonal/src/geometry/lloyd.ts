// Lloyd 완화(centroidal Voronoi): 각 점을 자기 Voronoi 칸의 무게중심으로 옮겨 빈 곳을 고르게 메운다.
// 크기가 다른 원을 위해 거리 대신 power distance(거리² − r²)로 칸을 나눈다(큰 원이 더 넓은 칸을 가진다).
// 칸은 영역을 격자로 훑어 가장 가까운 원에 배정하는 방식으로 근사한다(외부 의존성 없음, N≈15~35에서 수 ms).
// 순수 함수이며 같은 입력이면 같은 결과가 나온다.

/** 원 하나(중심과 반지름). */
export type Circle = { id: string; x: number; y: number; r: number }

export type LloydOptions = {
  /** 점이 머물 영역(0..width, 0..height). */
  bounds: { width: number; height: number }
  /** 반복 횟수. */
  iterations?: number
  /** 한 번에 무게중심 쪽으로 가는 비율(0..1). 1이면 바로 이동한다. */
  step?: number
  /** 격자 한 칸의 한 변(px). 작을수록 정확하고 느리다. */
  cell?: number
}

/** 원 중심을 Voronoi 무게중심 쪽으로 옮긴 새 배열을 돌려준다. 입력은 바꾸지 않는다. */
export function lloydRelax(
  circles: readonly Circle[],
  { bounds, iterations = 6, step = 0.7, cell = 8 }: LloydOptions
): Circle[] {
  const next = circles.map((circle) => ({ ...circle }))
  if (next.length < 2) return next
  const columns = Math.max(1, Math.round(bounds.width / cell))
  const rows = Math.max(1, Math.round(bounds.height / cell))
  const cellW = bounds.width / columns
  const cellH = bounds.height / rows

  for (let pass = 0; pass < iterations; pass++) {
    const sumX = new Float64Array(next.length)
    const sumY = new Float64Array(next.length)
    const count = new Float64Array(next.length)
    for (let row = 0; row < rows; row++) {
      const y = (row + 0.5) * cellH
      for (let column = 0; column < columns; column++) {
        const x = (column + 0.5) * cellW
        let owner = 0
        let best = Infinity
        for (let i = 0; i < next.length; i++) {
          const c = next[i]!
          const power = (c.x - x) ** 2 + (c.y - y) ** 2 - c.r * c.r
          if (power < best) {
            best = power
            owner = i
          }
        }
        sumX[owner]! += x
        sumY[owner]! += y
        count[owner]! += 1
      }
    }
    for (let i = 0; i < next.length; i++) {
      if (!count[i]) continue
      const c = next[i]!
      c.x += (sumX[i]! / count[i]! - c.x) * step
      c.y += (sumY[i]! / count[i]! - c.y) * step
      c.x = Math.min(Math.max(c.x, c.r), bounds.width - c.r)
      c.y = Math.min(Math.max(c.y, c.r), bounds.height - c.r)
    }
  }
  return next
}
