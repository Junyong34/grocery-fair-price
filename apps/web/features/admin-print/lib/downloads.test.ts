import { describe, expect, it } from "vitest"

import { downloadPattern } from "./downloads"

describe("downloadPattern", () => {
  it("용지 자리를 비운 주소 꼴을 보여 준다", () => {
    expect(downloadPattern("monthly-2")).toBe("/downloads/monthly-2/{a4|a3}.pdf")
  })
})
