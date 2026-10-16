import { describe, expect, it } from "vitest"

import { routePatternOf } from "./route-pattern"

describe("routePatternOf", () => {
  it("app/ 기준 page 파일 경로를 라우트 패턴으로 바꾼다", () => {
    expect(routePatternOf("page.tsx")).toBe("/")
    expect(routePatternOf("seasonal/my-table/page.tsx")).toBe("/seasonal/my-table")
    expect(routePatternOf("seasonal/foods/[food]/page.tsx")).toBe("/seasonal/foods/[food]")
  })

  it("라우트 그룹 (x)는 주소에 나오지 않으므로 지운다", () => {
    expect(routePatternOf("seasonal/(this-month)/page.tsx")).toBe("/seasonal")
    expect(routePatternOf("seasonal/(this-month)/months/(detail)/[month]/page.tsx")).toBe("/seasonal/months/[month]")
  })

  it("@slot 아래와 가로채기 라우트는 자기 주소가 없으므로 null이다", () => {
    expect(routePatternOf("seasonal/@sheet/page.tsx")).toBeNull()
    expect(routePatternOf("seasonal/@sheet/[...catchAll]/page.tsx")).toBeNull()
    expect(routePatternOf("seasonal/(.)foods/[food]/page.tsx")).toBeNull()
    expect(routePatternOf("a/(..)b/page.tsx")).toBeNull()
    expect(routePatternOf("a/(...)b/page.tsx")).toBeNull()
  })

  it("윈도 경로 구분자도 받는다", () => {
    expect(routePatternOf("seasonal\\(season)\\seasons\\page.tsx")).toBe("/seasonal/seasons")
  })
})
