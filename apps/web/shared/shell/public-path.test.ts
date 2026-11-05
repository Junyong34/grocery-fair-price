import { describe, expect, it } from "vitest"

import { routes } from "@/shared/routes"

import { publicPath } from "./public-path"

describe("publicPath", () => {
  it("2a를 미리 그린 내부 경로는 사용자가 보는 /seasonal이다", () => {
    expect(publicPath(routes.seasonal.at(2026, 11))).toBe(routes.seasonal.root)
    expect(publicPath(routes.seasonal.at(2027, 1))).toBe(routes.seasonal.root)
  })

  it("다른 경로는 그대로다", () => {
    for (const path of [routes.home, routes.seasonal.root, routes.seasonal.month(3), routes.seasonal.food("napa-cabbage"), "/seasonal/attic"])
      expect(publicPath(path)).toBe(path)
  })
})
