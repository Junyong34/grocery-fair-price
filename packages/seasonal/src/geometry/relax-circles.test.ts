import { describe, expect, it } from "vitest"

import { relaxCircles } from "./relax-circles"

const bounds = { width: 300, height: 200 }

describe("relaxCircles", () => {
  it("겹친 두 원을 떼어 놓고, 고정한 원은 움직이지 않는다", () => {
    const result = relaxCircles(
      [
        { id: "a", x: 100, y: 100, r: 20 },
        { id: "b", x: 110, y: 100, r: 20 },
      ],
      { bounds, pinned: "a" }
    )
    const a = result.find((c) => c.id === "a")!
    const b = result.find((c) => c.id === "b")!

    expect(a).toMatchObject({ x: 100, y: 100 })
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(40 - 0.5)
  })

  it("밀려난 원도 영역 밖으로 나가지 않는다(원 전체가 안에 남는다)", () => {
    // 왼쪽 벽에 붙은 b를 a가 왼쪽으로 민다.
    const result = relaxCircles(
      [
        { id: "a", x: 45, y: 100, r: 20 },
        { id: "b", x: 25, y: 100, r: 20 },
      ],
      { bounds, pinned: "a" }
    )
    for (const c of result) {
      expect(c.x - c.r).toBeGreaterThanOrEqual(0)
      expect(c.x + c.r).toBeLessThanOrEqual(bounds.width)
      expect(c.y - c.r).toBeGreaterThanOrEqual(0)
      expect(c.y + c.r).toBeLessThanOrEqual(bounds.height)
    }
  })

  it("겹치지 않는 원은 그대로 둔다", () => {
    const circles = [
      { id: "a", x: 50, y: 50, r: 20 },
      { id: "b", x: 150, y: 50, r: 20 },
      { id: "c", x: 250, y: 150, r: 20 },
    ]
    expect(relaxCircles(circles, { bounds, pinned: "a", gap: 4 })).toEqual(
      circles
    )
  })

  it("틈(gap)만큼 더 벌린다", () => {
    const result = relaxCircles(
      [
        { id: "a", x: 100, y: 100, r: 20 },
        { id: "b", x: 140, y: 100, r: 20 },
      ],
      { bounds, pinned: "a", gap: 6 }
    )
    expect(result.find((c) => c.id === "b")!.x).toBeCloseTo(146)
  })
})
