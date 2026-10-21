import { describe, expect, it } from "vitest"

import { lloydRelax } from "./lloyd"
import type { Circle } from "./lloyd"

const bounds = { width: 600, height: 400 }

/** 가장 가까운 원에서 가장 멀리 있는 점까지의 거리(가장 큰 빈 원의 반지름, 원 가장자리 기준). */
function largestEmpty(circles: readonly Circle[]): number {
  let worst = 0
  for (let y = 0; y <= bounds.height; y += 5) {
    for (let x = 0; x <= bounds.width; x += 5) {
      const nearest = Math.min(...circles.map((c) => Math.hypot(c.x - x, c.y - y) - c.r))
      worst = Math.max(worst, nearest)
    }
  }
  return worst
}

describe("lloydRelax", () => {
  it("한쪽에 몰린 원을 영역 전체로 퍼뜨려 가장 큰 빈 곳을 줄인다", () => {
    const circles: Circle[] = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      x: 80 + (i % 4) * 40,
      y: 80 + Math.floor(i / 4) * 40,
      r: 25,
    }))
    const relaxed = lloydRelax(circles, { bounds, iterations: 12, step: 0.8 })
    expect(largestEmpty(relaxed)).toBeLessThan(largestEmpty(circles))
  })

  it("원은 영역 안에 남고, 입력은 바뀌지 않는다", () => {
    const circles: Circle[] = [
      { id: "a", x: 10, y: 10, r: 30 },
      { id: "b", x: 590, y: 390, r: 30 },
    ]
    const relaxed = lloydRelax(circles, { bounds })
    for (const c of relaxed) {
      expect(c.x).toBeGreaterThanOrEqual(c.r)
      expect(c.x).toBeLessThanOrEqual(bounds.width - c.r)
      expect(c.y).toBeGreaterThanOrEqual(c.r)
      expect(c.y).toBeLessThanOrEqual(bounds.height - c.r)
    }
    expect(circles[0]).toEqual({ id: "a", x: 10, y: 10, r: 30 })
  })

  it("같은 입력이면 같은 결과를 낸다", () => {
    const circles: Circle[] = Array.from({ length: 8 }, (_, i) => ({ id: String(i), x: 50 + i * 60, y: 200, r: 30 }))
    expect(lloydRelax(circles, { bounds })).toEqual(lloydRelax(circles, { bounds }))
  })
})
