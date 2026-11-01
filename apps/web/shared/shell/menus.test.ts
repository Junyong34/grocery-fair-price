import { describe, expect, it } from "vitest"

import { activeMenuKey, MENUS } from "./menus"

describe("MENUS", () => {
  it("어디서나 같은 4칸이다", () => {
    expect(MENUS.map((item) => item.label)).toEqual(["시세", "제철달력", "담은 품종", "나의 식탁"])
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
})
