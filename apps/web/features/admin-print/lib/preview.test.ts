import { describe, expect, it } from "vitest"

import { previewFrame } from "./preview"

describe("previewFrame", () => {
  it("A4 세로는 210×297mm를 px로 바꾸고 /print의 둘레 여백 24px씩을 더한다", () => {
    const frame = previewFrame("A4", "portrait")
    expect(frame.width).toBeCloseTo((210 * 96) / 25.4 + 48)
    expect(frame.height).toBeCloseTo((297 * 96) / 25.4 + 48)
  })

  it("가로는 폭과 높이를 바꾼다", () => {
    const portrait = previewFrame("A3", "portrait")
    const landscape = previewFrame("A3", "landscape")
    expect(landscape.width - 48).toBeCloseTo(portrait.height - 48)
  })
})
