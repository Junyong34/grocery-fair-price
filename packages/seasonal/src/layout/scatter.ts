// 흩어진 이미지 배치(와이어프레임 3.1 scat). 격자 없이 빈 자리를 찾아 촘촘히 흩뿌린다.
// 같은 달·같은 품종·같은 영역이면 언제나 같은 배치가 나온다(Math.random 대신 시드 LCG).
//
// 영역은 화면 구간마다 고정 비율인 기준 프레임(px)이다. 계산은 기준 px로 하고, 결과는 프레임에 대한 비율(0..1)로 낸다.
// 화면에서는 실제 폭에 맞춰 확대·축소만 하므로 폭이 바뀌어도 배치가 섞이지 않는다.

/** 배치 기준 프레임. big은 라벨이 큰 넓은 화면이다. */
export type ScatterFrame = { width: number; height: number; big: boolean }

export const SCATTER_FRAMES = {
  mobile: { width: 339, height: 240, big: false },
  desktop: { width: 736, height: 300, big: true },
} as const satisfies Record<string, ScatterFrame>

/** 배치된 품종 하나. 좌표와 크기는 프레임 대비 비율이다. */
export type ScatterItem = {
  id: string
  /** 그림 중심의 가로 위치(프레임 폭 대비) */
  cx: number
  /** 그림 중심의 세로 위치(프레임 높이 대비) */
  cy: number
  /** 그림 한 변(프레임 폭 대비). 그림은 정사각형이다. */
  size: number
  /** 기울기(도) */
  rotate: number
  /** 겹칠 때 쌓는 순서 */
  z: number
}

export type ScatterLayout = {
  /** 프레임 가로/세로 비 */
  aspect: number
  /** 그림 아래 라벨 높이(프레임 높이 대비) */
  label: number
  items: ScatterItem[]
}

const CANDIDATES = 26

export function scatterLayout({
  month,
  ids,
  frame,
}: {
  month: number
  ids: readonly string[]
  frame: ScatterFrame
}): ScatterLayout {
  const { width: W, height: H, big } = frame
  const n = ids.length
  let seed = (month * 7919 + n * 104729 + W) % 233280
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  const label = big ? 15 : 12
  const base = Math.min(Math.max(Math.sqrt((W * H * 0.5) / Math.max(n, 1)) - label * 0.5, big ? 34 : 24), big ? 120 : 96)

  const placed: { x: number; y: number; r: number }[] = []
  const items = ids.map((id, i) => {
    const size = Math.round(base * (0.8 + rand() * 0.4))
    let best = { x: 0, y: 0, gap: -Infinity }
    for (let c = 0; c < CANDIDATES; c++) {
      const x = rand() * (W - size)
      const y = rand() * (H - size - label)
      const r = size / 2
      const gap = placed.length
        ? Math.min(...placed.map((p) => Math.hypot(p.x - (x + r), p.y - (y + r)) - (p.r + r)))
        : Infinity
      if (gap > best.gap) best = { x, y, gap }
    }
    placed.push({ x: best.x + size / 2, y: best.y + size / 2, r: size / 2 })
    const rotate = (rand() - 0.5) * 22
    return {
      id,
      cx: (best.x + size / 2) / W,
      cy: (best.y + size / 2) / H,
      size: size / W,
      rotate: Math.round(rotate * 10) / 10,
      z: i % 4,
    }
  })

  return { aspect: W / H, label: label / H, items }
}
