import { foodScale } from "../data/food-sizes"
import { lloydRelax } from "../geometry/lloyd"
import { relaxShapes } from "../geometry/relax-shapes"
import { findFood } from "../data/foods"

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
  /** 오른쪽에 비워 둘 폭(px). 처음 배치(시드)만 이 밖에 놓고, 끌기 범위는 프레임 전체다. 그 자리에 같은 폭의 달력이 얹힌다. */
  reserveRight?: number
  /** 아래에 비워 둘 높이(px). 모바일 달 판은 그 자리에 달력이 고정된다. 시드만 피하고 끌기 범위는 프레임 전체다. */
  reserveBottom?: number
}

export const SCATTER_FRAMES = {
  mobile: { width: 339, height: 200, big: false },
  // 모바일 달 판: 위쪽에 그림, 아래 340px에는 달력이 바닥에 붙어 고정된다(6주짜리 달까지 들어가는 높이). 그림은 달력 위에도 놓을 수 있다.
  mobileMonth: { width: 339, height: 520, big: false, reserveBottom: 340 },
  // 6주짜리 달은 달력이 한 줄 더 길어 판도 그만큼 길다.
  mobileMonthTall: { width: 339, height: 600, big: false, reserveBottom: 420 },
  // 데스크톱은 품종 판(왼쪽)과 달력(오른쪽)이 한 줄에 놓인다. 판의 가로·세로 비는 그 칸 크기를 따른다.
  desktop: { width: 440, height: 300, big: true },
  // 맨 위 히어로 판: 본문 폭 전체를 쓴다(달력 없음).
  desktopHero: { width: 752, height: 440, big: true },
  // 달 섹션 판: 판 전체가 끌기 범위이고, 오른쪽 52%에는 달력이 얹힌다. 처음 배치는 달력 자리를 피한다.
  desktopMonth: { width: 752, height: 600, big: true, reserveRight: 391 },
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

/** 새 그림 하나를 놓을 때 "이미 놓인 그림 하나당" 보는 후보 수. 후보를 개수에 비례해 늘린다(Mitchell 1991, m·n+1). */
const CANDIDATES_PER_POINT = 10
/** 시드 배치 직후 겹침을 풀 때 남길 틈(프레임 px). */
const SEED_GAP = 8
const SEED_RELAX_ITERATIONS = 60
/** 후보 선택 뒤 빈 곳을 고르게 메우는 Lloyd 완화 횟수와 한 번에 가는 비율. 0이면 쓰지 않는다. */
const LLOYD_ITERATIONS = 10
const LLOYD_STEP = 0.7
/** 그림이 판 넓이에서 차지하는 비율. 낮을수록 그림이 작고 사이가 넓다. */
const COVERAGE = 0.45

export function scatterLayout({
  month,
  ids,
  frame,
  lloydIterations = LLOYD_ITERATIONS,
}: {
  month: number
  ids: readonly string[]
  frame: ScatterFrame
  /** Lloyd 완화 횟수. 테스트에서 비교하려고 열어 둔다. */
  lloydIterations?: number
}): ScatterLayout {
  const { width: W, height: H, big } = frame
  const n = ids.length
  const rand = seededRandom((month * 7919 + n * 104729 + W) % 233280)
  const label = labelHeight(frame)
  const base = Math.min(
    Math.max(
      Math.sqrt(((W - (frame.reserveRight ?? 0)) * (H - (frame.reserveBottom ?? 0)) * COVERAGE) / Math.max(n, 1)) - label * 0.5,
      big ? 34 : 24
    ),
    big ? 120 : 96
  )

  const placed: PlacedCircle[] = []
  const drafts = ids.map((id) => {
    // 기본 크기에 ±10% 변동을 주고, 품종별 배율(data/food-sizes)을 곱한다.
    const size = Math.round(base * (0.9 + rand() * 0.2) * foodScale(id))
    const spot = findOpenSpot({ placed, size, frame, rand })
    placed.push(spot)
    const rotate = (rand() - 0.5) * 22
    return { id, size, rotate }
  })

  // 후보 선택은 모퉁이·가장자리에 빈 곳을 남기고 겹침도 보장하지 않는다.
  // Lloyd 완화로 빈 곳을 고르게 메운 뒤, 그림과 이름표가 서로 겹치지 않게 풀어 최소 틈을 확보한다.
  const area = {
    width: W - (frame.reserveRight ?? 0),
    height: H - (frame.reserveBottom ?? 0) - label,
  }
  const circles = placed.map((spot, i) => ({ id: drafts[i]!.id, x: spot.x, y: spot.y, r: spot.r }))
  const spread = lloydIterations
    ? lloydRelax(circles, { bounds: area, iterations: lloydIterations, step: LLOYD_STEP })
    : circles
  const relaxed = relaxShapes(
    spread.map((circle) => ({
      ...circle,
      labelW: labelWidth(findFood(circle.id)?.name ?? circle.id, frame),
      labelH: label,
    })),
    {
      // 이름표까지 영역 안에 남도록, 이름표 높이를 포함한 전체 높이를 준다.
      bounds: { width: area.width, height: area.height + label },
      gap: SEED_GAP,
      iterations: SEED_RELAX_ITERATIONS,
    }
  )

  const items = drafts.map(({ id, size, rotate }, i) => ({
    id,
    cx: relaxed[i]!.x / W,
    cy: relaxed[i]!.y / H,
    size: size / W,
    rotate: Math.round(rotate * 10) / 10,
    z: i % 4,
  }))

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

/** 이름표 글자 크기(프레임 기준 px). 모든 품종이 같다. 화면(draggable-scatter)과 배치 계산이 같은 값을 쓴다. */
export function labelFontPx(frame: ScatterFrame): number {
  return frame.big ? 14 : 9.5
}

/** 그림 아래 이름표 높이(px). 글자 줄 높이(leading-tight ≈ 1.25)에 맞춘다. */
export function labelHeight(frame: ScatterFrame): number {
  return Math.ceil(labelFontPx(frame) * 1.3)
}

/**
 * 이름표 폭(px) 추정. 한글은 글자 하나가 글자 크기만큼 넓고(영문·숫자는 절반쯤), 먹음 표시 ✓ 한 자리를 늘 남겨 둔다.
 * 먹음 기록은 기기에만 있어 서버가 모르므로, 먹었을 때의 폭으로 잡아 겹침이 생기지 않게 한다.
 */
export function labelWidth(name: string, frame: ScatterFrame): number {
  const fontPx = labelFontPx(frame)
  let units = 1
  for (const char of name) units += /[\u3131-\uD79D]/.test(char) ? 1 : 0.55
  return Math.ceil(units * fontPx * 0.95)
}

/**
 * 이미 놓인 그림들과 가장 멀리 떨어진 자리를 후보 가운데서 고른다(그림 아래 라벨 자리를 남긴다). 후보 수는 놓인 그림 수에 비례한다.
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
  const candidates = CANDIDATES_PER_POINT * placed.length + 1
  for (let c = 0; c < candidates; c++) {
    const x = rand() * (frame.width - (frame.reserveRight ?? 0) - size) + r
    const y = rand() * (frame.height - (frame.reserveBottom ?? 0) - size - labelHeight(frame)) + r
    const gap = placed.length
      ? Math.min(...placed.map((p) => Math.hypot(p.x - x, p.y - y) - (p.r + r)))
      : Infinity
    if (gap > best.gap) best = { x, y, gap }
  }
  return { x: best.x, y: best.y, r }
}
