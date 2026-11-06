import { describe, expect, it } from "vitest"

import { activeMenuKey, MENUS, nextMenuOrigin } from "./menus"

describe("MENUS", () => {
  it("어디서나 같은 4칸이다", () => {
    expect(MENUS.map((item) => item.label)).toEqual(["시세", "제철달력", "장바구니", "나의 식탁"])
  })
})

describe("activeMenuKey", () => {
  it.each([
    ["/", "price"],
    ["/search", "price"],
    ["/prices/cabbage", "price"],
    ["/seasonal", "seasonal"],
    ["/seasonal/months", "seasonal"],
    ["/seasonal/months/11", "seasonal"],
    ["/seasonal/seasons/autumn", "seasonal"],
    ["/seasonal/festivals/chuseok", "seasonal"],
    ["/seasonal/sashimi/2", "seasonal"],
    ["/seasonal/foods/napa-cabbage", "seasonal"],
    ["/seasonal/downloads", "seasonal"],
    ["/seasonal/downloads/2027-monthly", "seasonal"],
    ["/basket", "basket"],
    ["/seasonal/my-table", "my-table"],
  ])("%s → %s", (pathname, key) => {
    expect(activeMenuKey(pathname)).toBe(key)
  })

  it.each(["/privacy", "/settings", "/settings/sources", "/seasonal/nope"])("%s는 활성 칸이 없다", (pathname) => {
    expect(activeMenuKey(pathname)).toBeNull()
  })

  describe("품종 상세는 출발한 화면의 탭을 따른다", () => {
    const food = "/seasonal/foods/napa-cabbage"

    it.each([
      ["/seasonal/my-table", "my-table"],
      ["/seasonal", "seasonal"],
      ["/seasonal/months/11", "seasonal"],
      ["/basket", "basket"],
      ["/prices/cabbage", "price"],
    ])("%s에서 왔으면 %s", (origin, key) => {
      expect(activeMenuKey(food, origin)).toBe(key)
    })

    it("직접 진입 · 새로고침(출발지 없음)은 제철달력", () => {
      expect(activeMenuKey(food, null)).toBe("seasonal")
    })

    it.each(["/settings", "/privacy", "/seasonal/nope"])("탭에 해당하지 않는 %s에서 왔으면 제철달력", (origin) => {
      expect(activeMenuKey(food, origin)).toBe("seasonal")
    })

    it("품종 상세가 아닌 화면은 출발지와 무관하게 경로로 정한다", () => {
      expect(activeMenuKey("/seasonal", "/seasonal/my-table")).toBe("seasonal")
      expect(activeMenuKey("/settings", "/seasonal/my-table")).toBeNull()
    })
  })
})

describe("nextMenuOrigin", () => {
  it("품종 상세가 아닌 경로를 기억한다", () => {
    expect(nextMenuOrigin(null, "/seasonal/my-table")).toBe("/seasonal/my-table")
    expect(nextMenuOrigin("/seasonal/my-table", "/seasonal")).toBe("/seasonal")
  })

  it("품종 상세로 가면 출발지를 그대로 둔다(다른 품종으로 옮겨도 유지)", () => {
    const first = nextMenuOrigin("/seasonal/my-table", "/seasonal/foods/napa-cabbage")
    expect(first).toBe("/seasonal/my-table")
    expect(nextMenuOrigin(first, "/seasonal/foods/gwamegi")).toBe("/seasonal/my-table")
  })

  it("직접 진입한 품종 상세는 출발지가 없다", () => {
    expect(nextMenuOrigin(null, "/seasonal/foods/napa-cabbage")).toBeNull()
  })
})
