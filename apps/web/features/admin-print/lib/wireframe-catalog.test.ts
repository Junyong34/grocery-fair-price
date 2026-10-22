import { describe, expect, it } from "vitest"

import { PRINT_KINDS } from "@workspace/seasonal/print/spec"

import { WIREFRAMES, wireframeOf, wireframesOf } from "./wireframe-catalog"
import { boundsOf, contains, contentBox } from "./wireframe-shapes"

describe("WIREFRAMES", () => {
  it("안 코드는 겹치지 않는다", () => {
    const codes = WIREFRAMES.map((entry) => entry.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("종류마다 시트 안이 셋 이상이고, 지금 옵션으로 되는 안이 하나 이상이다", () => {
    for (const kind of PRINT_KINDS) {
      const sheets = wireframesOf(kind, "sheet")
      expect(sheets.length, kind).toBeGreaterThanOrEqual(3)
      expect(sheets.some((entry) => entry.availability.status === "available"), kind).toBe(true)
    }
  })

  it("모든 안의 모든 방향이 안전 여백 안에만 그린다", () => {
    for (const entry of WIREFRAMES)
      for (const orientation of entry.orientations) {
        const shapes = entry.draw(orientation)
        expect(shapes.length, `${entry.code} ${orientation}`).toBeGreaterThan(0)
        const outside = shapes.filter((shape) => !contains(contentBox(orientation), boundsOf(shape)))
        expect(outside, `${entry.code} ${orientation}`).toEqual([])
      }
  })

  it("코드로 찾는다", () => {
    expect(wireframeOf("M-A")?.kind).toBe("monthly")
    expect(wireframeOf("없음")).toBeUndefined()
  })
})
