import { relaxShapes, type Shape } from "../geometry/relax-shapes"
import {
  findOpenSpot,
  labelBox,
  scatterGap,
  scatterRandom,
  type PlacedCircle,
  type ScatterFrame,
  type ScatterLayout,
} from "./scatter"

// 판 위 그림의 자리. 시드 배치(scatter) 뒤에 오는 단계를 모두 맡는다:
// 저장된 배치를 덧입힌 쉬는 자리(restingSpots), 끄는 동안의 자리(moveSpot), 놓은 뒤의 자리(settleSpots), 판 위 달력 자리(clampCalendar).
// 모든 단계가 시드 배치와 같은 겹침 규칙(그림 원 + 아래 이름표, scatterGap)을 쓴다. 끌기 범위는 프레임 전체다.
// 좌표는 프레임 대비 비율(0..1)이다. DOM·React와 무관한 순수 함수다.

/** 그림 중심(프레임 대비 비율). */
export type Spot = { cx: number; cy: number }
export type Spots = ReadonlyMap<string, Spot>
/** 기기에 저장한 품종 하나의 자리. */
export type SavedSpot = { id: string } & Spot

/**
 * 판이 쉬고 있을 때의 자리. 저장한 배치가 없으면 시드 배치 그대로다.
 * - 저장된 품종은 옮긴 자리를 지킨다. 크기·기울기는 지금 시드 배치를 따른다(품종 수가 바뀌면 크기도 바뀐다).
 * - 목록에서 빠진 품종은 지운다.
 * - 새로 생긴 품종은 저장된 그림들과 가장 멀리 떨어진 빈자리에 넣는다(시드 배치와 같은 후보 탐색).
 * - 크기가 바뀌어 생긴 겹침을 마지막에 푼다.
 */
export function restingSpots({
  month,
  seed,
  saved,
  frame,
}: {
  month: number
  seed: ScatterLayout
  saved: readonly SavedSpot[] | undefined
  frame: ScatterFrame
}): Spots {
  if (!saved?.length) return new Map(seed.items.map((item) => [item.id, { cx: item.cx, cy: item.cy }]))
  const byId = new Map(saved.map((spot) => [spot.id, spot]))
  const placed: PlacedCircle[] = seed.items.flatMap((item) => {
    const spot = byId.get(item.id)
    return spot ? [{ x: spot.cx * frame.width, y: spot.cy * frame.height, r: (item.size * frame.width) / 2 }] : []
  })
  // 새 품종 자리도 같은 입력이면 같은 결과가 나오게 시드 배치와 다른 수열을 고정한다.
  const rand = scatterRandom({ month, count: seed.items.length, frame, salt: 1 })
  const merged = new Map<string, Spot>(
    seed.items.map((item) => {
      const spot = byId.get(item.id)
      if (spot) return [item.id, { cx: spot.cx, cy: spot.cy }]
      const open = findOpenSpot({ placed, size: item.size * frame.width, frame, rand })
      placed.push(open)
      return [item.id, { cx: open.x / frame.width, cy: open.y / frame.height }]
    })
  )
  return relax(merged, seed, frame)
}

/**
 * 끄는 동안의 자리. 끄는 그림은 to를 지키고(판 밖이면 안으로 들인다) 주변 그림이 비켜선다.
 * 벽에 몰린 그림은 끝까지 비키지 못할 수 있다. 놓을 때 settleSpots가 마저 푼다.
 */
export function moveSpot({
  seed,
  frame,
  spots,
  id,
  to,
}: {
  seed: ScatterLayout
  frame: ScatterFrame
  spots: Spots
  id: string
  to: Spot
}): Spots {
  const moved = new Map(spots)
  moved.set(id, to)
  return relax(moved, seed, frame, id)
}

/** 놓은 뒤의 자리. 끈 그림도 함께 움직여 남은 겹침을 모두 푼다. 저장하는 값이다. */
export function settleSpots({ seed, frame, spots }: { seed: ScatterLayout; frame: ScatterFrame; spots: Spots }): SavedSpot[] {
  return [...relax(spots, seed, frame)].map(([id, spot]) => ({ id, ...spot }))
}

/** 판 위 달력의 왼쪽 위 자리를 판 안에 가둔다. size는 달력 폭·높이(판 대비 비율). 판보다 높으면 위에 붙인다. */
export function clampCalendar(spot: { x: number; y: number }, size: { width: number; height: number }) {
  return {
    x: Math.min(Math.max(spot.x, 0), 1 - size.width),
    y: Math.min(Math.max(spot.y, 0), Math.max(0, 1 - size.height)),
  }
}

function relax(spots: Spots, seed: ScatterLayout, frame: ScatterFrame, pinned?: string): Spots {
  const shapes: Shape[] = seed.items.map((item) => {
    const spot = spots.get(item.id)!
    return {
      id: item.id,
      x: spot.cx * frame.width,
      y: spot.cy * frame.height,
      r: (item.size * frame.width) / 2,
      ...labelBox(item.id, frame),
    }
  })
  const relaxed = relaxShapes(shapes, { bounds: frame, pinned, gap: scatterGap(frame) })
  return new Map(relaxed.map((shape) => [shape.id, { cx: shape.x / frame.width, cy: shape.y / frame.height }]))
}
