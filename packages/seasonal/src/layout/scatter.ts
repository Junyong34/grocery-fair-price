// 흩어진 이미지 배치(와이어프레임 3.1 scat). 격자 없이 빈 자리를 찾아 촘촘히 흩뿌린다.
// 같은 달·같은 품종·같은 영역이면 언제나 같은 배치가 나온다(Math.random 대신 시드 LCG).
//
// 영역은 화면 구간마다 고정 비율인 기준 프레임(px)이다. 계산은 기준 px로 하고, 결과는 프레임에 대한 비율(0..1)로 낸다.
// 화면에서는 실제 폭에 맞춰 확대·축소만 하므로 폭이 바뀌어도 배치가 섞이지 않는다.

/** 배치 기준 프레임. big은 라벨이 큰 넓은 화면이다. */
export type ScatterFrame = {
  width: number
  height: number
  big: boolean
  /** 오른쪽에 비워 둘 폭(px). 처음 배치(시드)만 이 밖에 놓고, 끌기 범위는 프레임 전체다. 그 자리에 달력이 얹힌다. */
  reserveRight?: number
}

export const SCATTER_FRAMES = {
  mobile: { width: 339, height: 200, big: false },
  // 데스크톱은 품종 판(왼쪽)과 달력(오른쪽)이 한 줄에 놓인다. 판의 가로·세로 비는 그 칸 크기를 따른다.
  desktop: { width: 440, height: 300, big: true },
  // 달 섹션 판: 판 전체가 끌기 범위이고, 오른쪽 45%에는 달력이 얹힌다. 처음 배치는 달력 자리를 피한다.
  desktopMonth: { width: 752, height: 600, big: true, reserveRight: 340 },
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
  const rand = seededRandom((month * 7919 + n * 104729 + W) % 233280)
  const label = labelHeight(frame)
  const base = Math.min(
    Math.max(
      Math.sqrt(((W - (frame.reserveRight ?? 0)) * H * 0.5) / Math.max(n, 1)) - label * 0.5,
      big ? 34 : 24
    ),
    big ? 120 : 96
  )

  const placed: PlacedCircle[] = []
  const items = ids.map((id, i) => {
    const size = Math.round(base * (0.8 + rand() * 0.4))
    const spot = findOpenSpot({ placed, size, frame, rand })
    placed.push(spot)
    const rotate = (rand() - 0.5) * 22
    return {
      id,
      cx: spot.x / W,
      cy: spot.y / H,
      size: size / W,
      rotate: Math.round(rotate * 10) / 10,
      z: i % 4,
    }
  })

  return { aspect: W / H, label: label / H, items }
}

/** 프레임 px 기준 원(그림 중심과 반지름). */
export type PlacedCircle = { x: number; y: number; r: number }

/** 와이어프레임 scat의 LCG. 같은 시드면 같은 수열이 나온다. */
export function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** 그림 아래 라벨 높이(px). */
export function labelHeight(frame: ScatterFrame): number {
  return frame.big ? 15 : 12
}

/**
 * 이미 놓인 그림들과 가장 멀리 떨어진 자리를 후보 26개 가운데서 고른다(그림 아래 라벨 자리를 남긴다).
 * 시드 배치와, 저장된 배치에 새 품종을 넣을 때 같이 쓴다.
 */
export function findOpenSpot({
  placed,
  size,
  frame,
  rand,
}: {
  placed: readonly PlacedCircle[]
  size: number
  frame: ScatterFrame
  rand: () => number
}): PlacedCircle {
  const r = size / 2
  let best = { x: r, y: r, gap: -Infinity }
  for (let c = 0; c < CANDIDATES; c++) {
    const x = rand() * (frame.width - (frame.reserveRight ?? 0) - size) + r
    const y = rand() * (frame.height - size - labelHeight(frame)) + r
    const gap = placed.length
      ? Math.min(...placed.map((p) => Math.hypot(p.x - x, p.y - y) - (p.r + r)))
      : Infinity
    if (gap > best.gap) best = { x, y, gap }
  }
  return { x: best.x, y: best.y, r }
}
