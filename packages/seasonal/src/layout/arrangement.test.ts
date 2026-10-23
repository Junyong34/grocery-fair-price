import { describe, expect, it } from "vitest"

import { findFood, monthHighlights } from "../data/foods"
import { clampCalendar, moveSpot, restingSpots, settleSpots, type Spots } from "./arrangement"
import { labelHeight, labelWidth, SCATTER_FRAMES, SCATTER_MAX_FOODS, scatterLayout, type ScatterFrame, type ScatterLayout } from "./scatter"

const frame = SCATTER_FRAMES.mobile

/** 그림(원)과 이름표(직사각형)가 서로 겹친 쌍. 화면에 그려지는 모양 그대로 잰다. */
function overlaps(spots: Spots, seed: ScatterLayout, frame: ScatterFrame): string[] {
  const parts = seed.items.map((item) => {
    const spot = spots.get(item.id)!
    const r = (item.size * frame.width) / 2
    const x = spot.cx * frame.width
    const y = spot.cy * frame.height
    const w = labelWidth(foodsName(item.id), frame)
    return { id: item.id, x, y, r, rect: { x0: x - w / 2, x1: x + w / 2, y0: y + r, y1: y + r + labelHeight(frame) } }
  })
  type Part = (typeof parts)[number]
  const circleHitsRect = (c: Part, o: Part) => {
    const nx = Math.min(Math.max(c.x, o.rect.x0), o.rect.x1)
    const ny = Math.min(Math.max(c.y, o.rect.y0), o.rect.y1)
    return Math.hypot(nx - c.x, ny - c.y) < c.r - 0.5
  }
  const hits: string[] = []
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i]!
      const b = parts[j]!
      const rects =
        Math.min(a.rect.x1, b.rect.x1) - Math.max(a.rect.x0, b.rect.x0) > 0.5 &&
        Math.min(a.rect.y1, b.rect.y1) - Math.max(a.rect.y0, b.rect.y0) > 0.5
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 0.5 || circleHitsRect(a, b) || circleHitsRect(b, a) || rects)
        hits.push(`${a.id}-${b.id}`)
    }
  }
  return hits
}

const foodsName = (id: string) => findFood(id)?.name ?? id

describe("restingSpots", () => {
  it("저장한 배치가 없으면 시드 배치 그대로다", () => {
    const seed = scatterLayout({ month: 7, ids: ["a", "b"], frame })
    const spots = restingSpots({ month: 7, seed, saved: undefined, frame })
    expect([...spots]).toEqual(seed.items.map((item) => [item.id, { cx: item.cx, cy: item.cy }]))
  })

  it("저장된 품종은 옮긴 자리를 지키고, 빠진 품종은 지운다", () => {
    const frame = SCATTER_FRAMES.desktopHero
    const seed = scatterLayout({ month: 10, ids: ["a", "b", "c"], frame })
    const free = { cx: 0.2, cy: 0.3 }
    const saved = [
      { id: "a", ...free },
      { id: "b", cx: 0.5, cy: 0.3 },
      { id: "c", cx: 0.8, cy: 0.3 },
      { id: "gone", cx: 0.5, cy: 0.5 },
    ]
    const spots = restingSpots({ month: 10, seed, saved, frame })
    expect([...spots.keys()]).toEqual(["a", "b", "c"])
    expect(spots.get("a")!.cx).toBeCloseTo(free.cx, 3)
    expect(spots.get("a")!.cy).toBeCloseTo(free.cy, 3)
  })

  it("새로 생긴 품종은 저장된 그림들과 겹치지 않는 자리에 넣는다", () => {
    const seed = scatterLayout({ month: 3, ids: ["a", "b", "new"], frame })
    // 저장된 a를 새 품종의 시드 자리 바로 위에 올려 둔다. 그대로 두면 겹친다.
    const at = seed.items.find((item) => item.id === "new")!
    const saved = [
      { id: "a", cx: at.cx, cy: at.cy },
      { id: "b", cx: 0.9, cy: 0.2 },
    ]
    const spots = restingSpots({ month: 3, seed, saved, frame })
    expect(overlaps(spots, seed, frame)).toEqual([])
  })

  it("같은 입력이면 같은 결과를 낸다", () => {
    const seed = scatterLayout({ month: 5, ids: ["a", "b", "c", "d"], frame })
    const saved = [{ id: "a", cx: 0.5, cy: 0.4 }]
    expect(restingSpots({ month: 5, seed, saved, frame })).toEqual(restingSpots({ month: 5, seed, saved, frame }))
  })
})

describe("moveSpot", () => {
  it("끄는 그림은 손가락 자리에 머물고, 주변 그림이 비켜난다", () => {
    const seed = scatterLayout({ month: 10, ids: ["a", "b", "c"], frame })
    const spots = restingSpots({ month: 10, seed, saved: undefined, frame })
    const to = { cx: 0.5, cy: 0.4 }
    const moved = moveSpot({ seed, frame, spots, id: "a", to })
    expect(moved.get("a")).toEqual(to)
    // 끄는 그림과는 겹치지 않는다. 나머지끼리 남은 겹침은 놓을 때 푼다(settleSpots).
    expect(overlaps(moved, seed, frame).filter((pair) => pair.split("-").includes("a"))).toEqual([])
  })

  it("실제 품종을 끌어 놓아도 그림과 이름표가 겹치지 않는다", () => {
    for (const frame of [SCATTER_FRAMES.desktopMonth, SCATTER_FRAMES.mobileMonth]) {
      for (const month of [1, 4, 8, 10, 11]) {
        const ids = monthHighlights(month, SCATTER_MAX_FOODS).map((food) => food.id)
        const seed = scatterLayout({ month, ids, frame })
        let spots = restingSpots({ month, seed, saved: undefined, frame })
        // 첫 그림을 두 번째 그림 바로 아래(이름표 자리)로 끌어 놓는다.
        const target = spots.get(ids[1]!)!
        const to = { cx: target.cx, cy: target.cy + seed.items[1]!.size * seed.aspect * 0.6 }
        spots = moveSpot({ seed, frame, spots, id: ids[0]!, to })
        const settled = new Map(settleSpots({ seed, frame, spots }).map(({ id, ...spot }) => [id, spot]))
        expect(overlaps(settled, seed, frame), `${month}월`).toEqual([])
      }
    }
  })

  it("판 밖으로 끌어도 그림과 이름표는 판 안에 남는다", () => {
    const seed = scatterLayout({ month: 6, ids: ["a", "b"], frame })
    const spots = restingSpots({ month: 6, seed, saved: undefined, frame })
    const moved = moveSpot({ seed, frame, spots, id: "a", to: { cx: 1.4, cy: 1.4 } })
    const a = moved.get("a")!
    const r = (seed.items[0]!.size * frame.width) / 2
    expect(a.cx * frame.width + r).toBeLessThanOrEqual(frame.width + 0.01)
    expect(a.cy * frame.height + r + labelHeight(frame)).toBeLessThanOrEqual(frame.height + 0.01)
  })
})

describe("clampCalendar", () => {
  it("달력을 판 안에 가둔다", () => {
    expect(clampCalendar({ x: -0.2, y: 0.9 }, { width: 0.5, height: 0.3 })).toEqual({ x: 0, y: 0.7 })
    expect(clampCalendar({ x: 0.8, y: -1 }, { width: 0.5, height: 0.3 })).toEqual({ x: 0.5, y: 0 })
  })

  it("판보다 높은 달력은 위에 붙인다", () => {
    expect(clampCalendar({ x: 0.1, y: 0.4 }, { width: 0.5, height: 1.2 })).toEqual({ x: 0.1, y: 0 })
  })
})
