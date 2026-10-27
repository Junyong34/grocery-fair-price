import { describe, expect, it } from "vitest"

import { foodsPerCell, LAYOUT_DEFS, layoutDef, layoutReads, LAYOUTS } from "./layouts"
import { DEFAULT_SPECS, parsePrintSpec, PRINT_KINDS } from "./spec"

describe("LAYOUT_DEFS", () => {
  it.each(PRINT_KINDS)("%s: 구성 값마다 정의가 하나씩 있다", (kind) => {
    expect(Object.keys(LAYOUT_DEFS[kind]).sort()).toEqual([...LAYOUTS[kind]].sort())
  })
})

describe("세로 전용 구성", () => {
  const portraitOnly = PRINT_KINDS.flatMap((kind) =>
    LAYOUTS[kind].filter((layout) => layoutDef({ kind, layout } as never).portraitOnly).map((layout) => `${kind}/${layout}`)
  )

  it("정의에서 고른 구성만 세로 전용이다", () => {
    expect(portraitOnly).toEqual(["monthly/side-check", "year-sheet/hero-top", "month-poster/rows-check"])
  })

  it.each(PRINT_KINDS)("%s: 스키마가 가로 + 세로 전용 구성을 거절하고 나머지는 받는다", (kind) => {
    for (const layout of LAYOUTS[kind]) {
      // 2x6 배열은 가로 용지에서 따로 거절되므로 3x4로 둔다.
      const grid = "grid" in DEFAULT_SPECS[kind] ? { grid: "3x4" } : {}
      const parsed = parsePrintSpec({ ...DEFAULT_SPECS[kind], ...grid, layout, orientation: "landscape" })
      expect(parsed instanceof Error, `${kind}/${layout}`).toBe(portraitOnly.includes(`${kind}/${layout}`))
    }
  })
})

describe("layoutReads", () => {
  it("구성이 읽지 않는 옵션", () => {
    const strip = { ...DEFAULT_SPECS.monthly, layout: "strip" as const }
    expect(layoutReads(strip, "memo")).toBe(false)
    expect(layoutReads(strip, "foods.names")).toBe(true)
  })

  it("가로 용지일 때만 읽지 않는 옵션", () => {
    const allover = { ...DEFAULT_SPECS.monthly, layout: "allover" as const }
    expect(layoutReads(allover, "calendar.weekStart")).toBe(true)
    expect(layoutReads({ ...allover, orientation: "landscape" }, "calendar.weekStart")).toBe(false)
  })
})

describe("foodsPerCell", () => {
  it("사양의 개수와 판 크기 상한 가운데 작은 쪽", () => {
    const poster = DEFAULT_SPECS["month-poster"]
    expect(foodsPerCell({ ...poster, layout: "wheel", foods: { ...poster.foods, max: 12 } })).toBe(4)
    expect(foodsPerCell({ ...poster, layout: "rows-check", foods: { ...poster.foods, max: 3 } })).toBe(3)
    expect(foodsPerCell({ ...poster, layout: "cells", foods: { ...poster.foods, max: 12 } })).toBe(12)
  })
})
