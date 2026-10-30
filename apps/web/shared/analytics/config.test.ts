import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { analyticsConfig } = await import("./config")

describe("analyticsConfig", () => {
  it("측정 ID가 없으면 붙이지 않는다", () => {
    expect(analyticsConfig({ NODE_ENV: "production" })).toBeNull()
    expect(analyticsConfig({ NODE_ENV: "production", GA_MEASUREMENT_ID: " " })).toBeNull()
  })

  it("운영 빌드에서만 붙인다. 개발 서버는 GA_DEBUG일 때만(DebugView)", () => {
    expect(analyticsConfig({ NODE_ENV: "production", GA_MEASUREMENT_ID: "G-TEST" })).toEqual({ measurementId: "G-TEST", debug: false })
    expect(analyticsConfig({ NODE_ENV: "development", GA_MEASUREMENT_ID: "G-TEST" })).toBeNull()
    expect(analyticsConfig({ NODE_ENV: "development", GA_MEASUREMENT_ID: "G-TEST", GA_DEBUG: "true" })).toEqual({ measurementId: "G-TEST", debug: true })
  })
})
