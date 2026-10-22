// 원형 판: 원을 부채꼴 N개로 나누고 부채꼴마다 그림 몇 개를 놓는다. 월별 포스터 P-C(12개), 계절 포스터 S-C(4개)가 같이 쓴다.
// 가운데 빈 원(core)과 바깥 표기 띠(band) 사이 고리에 그림을 놓는다. 그리기는 apps/web/features/print/parts/wheel.tsx가 한다.
// 각도는 12시 방향에서 시계 방향으로 잰 라디안이다. 좌표는 지름 diameter 정사각형의 왼쪽 위가 원점이다.

/** 그림 하나의 중심(용지 단위) */
export type WheelSlot = { x: number; y: number }

export type WheelSector = {
  /** 부채꼴 시작·끝 각도 */
  start: number
  end: number
  /** 표기(달·계절 이름) 중심. 바깥 띠 가운데, 부채꼴 가운데 각도다. */
  label: { x: number; y: number }
  slots: WheelSlot[]
}

export type WheelLayout = {
  diameter: number
  /** 그림을 놓는 고리의 안쪽·바깥 반지름 */
  inner: number
  outer: number
  /** 모든 그림의 한 변(같은 크기). 가장 빽빽한 부채꼴에 맞춘다. */
  pictureSize: number
  sectors: WheelSector[]
}

/** 그림 사이 여백: 들어갈 수 있는 최대 크기에 곱한다. */
const FILL = 0.88

/**
 * 부채꼴마다 counts[i]개를 놓는다. 고리를 k줄로 나누고 줄마다 개수를 정하는데, 바깥 줄일수록 둘레가 길어 많이 들어간다.
 * 줄 수와 줄마다 개수는 그 부채꼴 그림이 가장 커지게 고른다(줄마다 하나씩 두고, 남은 그림을 넣어도 가장 덜 작아지는 줄에 하나씩).
 * 그림은 부채꼴 경계선·고리 안쪽·바깥 원에서 그림 반지름 이상 떨어지고, 서로 그림 크기 이상 떨어진다.
 */
export function wheelLayout({
  diameter,
  sectors,
  counts,
  core = 0.3,
  band = 0.11,
}: {
  diameter: number
  sectors: number
  counts: readonly number[]
  /** 가운데 빈 원의 반지름(전체 반지름 대비) */
  core?: number
  /** 바깥 표기 띠 두께(전체 반지름 대비) */
  band?: number
}): WheelLayout {
  const radius = diameter / 2
  const inner = radius * core
  const outer = radius * (1 - band)
  const spread = (Math.PI * 2) / sectors
  const plans = counts.map((count) => planSector(count, inner, outer, spread))
  const pictureSize = Math.min(...plans.filter((plan) => plan.rings.length).map((plan) => plan.size), outer - inner) * FILL
  const at = (angle: number, r: number) => ({ x: radius + r * Math.sin(angle), y: radius - r * Math.cos(angle) })

  return {
    diameter,
    inner,
    outer,
    pictureSize,
    sectors: plans.map((plan, i) => {
      const start = i * spread
      return {
        start,
        end: start + spread,
        label: at(start + spread / 2, (outer + radius) / 2),
        slots: plan.rings.flatMap(({ r, count }) => Array.from({ length: count }, (_, j) => at(start + (spread * (j + 0.5)) / count, r))),
      }
    }),
  }
}

/** 고리 r 위에 m개를 고르게 놓을 때 들어가는 그림 크기(이웃·경계선과의 거리). */
const arc = (r: number, m: number, spread: number) => 2 * r * Math.sin(Math.min(spread / (2 * m), Math.PI / 2))

function planSector(count: number, inner: number, outer: number, spread: number): { size: number; rings: { r: number; count: number }[] } {
  let best: { size: number; rings: { r: number; count: number }[] } = { size: 0, rings: [] }
  for (let k = 1; k <= count; k++) {
    const thickness = (outer - inner) / k
    const rings = Array.from({ length: k }, (_, j) => ({ r: inner + thickness * (j + 0.5), count: 1 }))
    for (let left = count - k; left > 0; left--) {
      const ring = rings.reduce((a, b) => (arc(b.r, b.count + 1, spread) > arc(a.r, a.count + 1, spread) ? b : a))
      ring.count++
    }
    const size = Math.min(thickness, ...rings.map((ring) => arc(ring.r, ring.count, spread)))
    if (size > best.size) best = { size, rings }
  }
  return best
}
