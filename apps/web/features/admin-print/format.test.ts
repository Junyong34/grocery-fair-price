import { describe, expect, it } from "vitest"

import { formatBuildDate, formatBuildTime } from "./format"

describe("생성 시각 표시", () => {
  it("UTC로 기록된 시각을 한국 시간으로 보여 준다", () => {
    expect(formatBuildTime("2026-10-16T13:11:35.000Z")).toBe("2026-10-16 22:11")
  })

  it("한국 시간으로 날짜가 넘어가는 시각은 다음 날로 보여 준다", () => {
    expect(formatBuildTime("2026-10-16T16:00:00.000Z")).toBe("2026-10-17 01:00")
    expect(formatBuildDate("2026-10-16T16:00:00.000Z")).toBe("2026-10-17")
  })

  it("날짜만 보일 때도 한국 날짜를 쓴다", () => {
    expect(formatBuildDate("2026-10-16T13:11:35.000Z")).toBe("2026-10-16")
  })
})
