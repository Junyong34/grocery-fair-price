import { describe, expect, it } from "vitest"

import { PRINT_SCREEN_GUTTER } from "@/shared/print-screen"

import { previewFrame } from "./preview"

describe("previewFrame", () => {
  it("A4 세로는 210×297mm를 px로 바꾸고 /print의 둘레 여백 24px씩을 더한다", () => {
    const frame = previewFrame("A4", "portrait")
    expect(frame.width).toBeCloseTo((210 * 96) / 25.4 + PRINT_SCREEN_GUTTER * 2)
    expect(frame.height).toBeCloseTo((297 * 96) / 25.4 + PRINT_SCREEN_GUTTER * 2)
  })

  it("가로는 폭과 높이를 바꾼다", () => {
    const portrait = previewFrame("A3", "portrait")
    const landscape = previewFrame("A3", "landscape")
    expect(landscape.width).toBeCloseTo(portrait.height)
  })
})
