import { describe, expect, it } from "vitest"

import { relaxShapes, type Shape } from "./relax-shapes"

const bounds = { width: 400, height: 300 }
const shape = (id: string, x: number, y: number, r = 30, labelW = 70, labelH = 16): Shape => ({ id, x, y, r, labelW, labelH })

describe("relaxShapes", () => {
  it("겹친 원을 떼어 놓는다", () => {
    const [a, b] = relaxShapes([shape("a", 100, 100), shape("b", 110, 100)], { bounds })
    expect(Math.hypot(b!.x - a!.x, b!.y - a!.y)).toBeGreaterThanOrEqual(60 - 0.5)
  })

  it("한 그림의 이름표가 다른 그림 위로 올라와도 떼어 놓는다", () => {
    // b의 원이 a의 이름표(원 바로 아래) 자리에 있다.
    const [a, b] = relaxShapes([shape("a", 100, 80), shape("b", 100, 80 + 30 + 8)], { bounds })
    const labelTop = a!.y + a!.r
    const labelBottom = labelTop + a!.labelH
    const nearestX = Math.min(Math.max(b!.x, a!.x - a!.labelW / 2), a!.x + a!.labelW / 2)
    const nearestY = Math.min(Math.max(b!.y, labelTop), labelBottom)
    expect(Math.hypot(b!.x - nearestX, b!.y - nearestY)).toBeGreaterThanOrEqual(b!.r - 0.5)
  })

  it("이름표끼리 겹치지 않는다", () => {
    const [a, b] = relaxShapes([shape("a", 100, 100, 20, 90), shape("b", 140, 100, 20, 90)], { bounds })
    expect(Math.abs(b!.x - a!.x) >= 90 - 0.5 || Math.abs(b!.y - a!.y) >= 16 - 0.5).toBe(true)
  })

  it("원과 이름표가 영역 안에 남고 입력은 바뀌지 않는다", () => {
    const input = [shape("a", 5, 5, 30, 120), shape("b", 395, 295)]
    const out = relaxShapes(input, { bounds })
    for (const s of out) {
      expect(s.x - Math.max(s.r, s.labelW / 2)).toBeGreaterThanOrEqual(-1e-6)
      expect(s.x + Math.max(s.r, s.labelW / 2)).toBeLessThanOrEqual(bounds.width + 1e-6)
      expect(s.y - s.r).toBeGreaterThanOrEqual(-1e-6)
      expect(s.y + s.r + s.labelH).toBeLessThanOrEqual(bounds.height + 1e-6)
    }
    expect(input[0]).toEqual({ id: "a", x: 5, y: 5, r: 30, labelW: 120, labelH: 16 })
  })

  it("같은 입력이면 같은 결과를 낸다", () => {
    const input = [shape("a", 100, 100), shape("b", 110, 105), shape("c", 120, 98)]
    expect(relaxShapes(input, { bounds })).toEqual(relaxShapes(input, { bounds }))
  })
})
