import {
  findOpenSpot,
  seededRandom,
  type PlacedCircle,
  type ScatterFrame,
  type ScatterLayout,
} from "./scatter"

/** 기기에 저장한 품종 하나의 자리(그림 중심, 프레임 대비 비율). */
export type SavedSpot = { id: string; cx: number; cy: number }

/**
 * 사용자가 옮겨 저장한 배치를 지금 품종 목록의 시드 배치에 덧입힌다(품종 목록은 데이터가 늘며 바뀐다).
 * - 저장된 품종은 옮긴 자리를 지킨다. 크기·기울기는 지금 시드 배치를 따른다(품종 수가 바뀌면 크기도 바뀐다).
 * - 목록에서 빠진 품종은 지운다.
 * - 새로 생긴 품종은 저장된 그림들과 가장 멀리 떨어진 빈자리에 넣는다(시드 배치와 같은 후보 탐색).
 * 크기가 바뀌어 생긴 작은 겹침은 화면이 겹침 해소로 푼다.
 */
export function mergeSavedLayout({
  month,
  seed,
  saved,
  frame,
}: {
  month: number
  seed: ScatterLayout
  saved: readonly SavedSpot[]
  frame: ScatterFrame
}): ScatterLayout {
  if (!saved.length) return seed
  const byId = new Map(saved.map((spot) => [spot.id, spot]))
  const toCircle = (cx: number, cy: number, size: number): PlacedCircle => ({
    x: cx * frame.width,
    y: cy * frame.height,
    r: (size * frame.width) / 2,
  })

  const placed = seed.items.flatMap((item) => {
    const spot = byId.get(item.id)
    return spot ? [toCircle(spot.cx, spot.cy, item.size)] : []
  })
  // 새 품종 자리도 같은 입력이면 같은 결과가 나오게 시드를 고정한다.
  const rand = seededRandom(
    (month * 7919 + seed.items.length * 104729 + frame.width + 1) % 233280
  )

  return {
    ...seed,
    items: seed.items.map((item) => {
      const spot = byId.get(item.id)
      if (spot) return { ...item, cx: spot.cx, cy: spot.cy }
      const open = findOpenSpot({
        placed,
        size: item.size * frame.width,
        frame,
        rand,
      })
      placed.push(open)
      return { ...item, cx: open.x / frame.width, cy: open.y / frame.height }
    }),
  }
}
