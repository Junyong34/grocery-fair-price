import { describe, expect, it } from "vitest"

import { screenOf } from "./screens"

describe("screenOf", () => {
  it.each([
    ["/", "root", "hide-on-scroll"],
    ["/search", "search", "pinned"],
    ["/prices/cabbage", "sub", "pinned"],
    ["/basket", "root", "pinned"],
    ["/seasonal", "root", "hide-on-scroll"],
    ["/seasonal/months", "root", "hide-on-scroll"],
    ["/seasonal/months/11", "root", "hide-on-scroll"],
    ["/seasonal/seasons", "root", "hide-on-scroll"],
    ["/seasonal/seasons/autumn", "root", "hide-on-scroll"],
    ["/seasonal/festivals/chuseok", "root", "hide-on-scroll"],
    ["/seasonal/my-table", "root", "pinned"],
    ["/seasonal/foods/napa-cabbage", "sub", "pinned"],
    ["/seasonal/downloads", "sub", "pinned"],
    ["/seasonal/downloads/2027-monthly", "sub", "pinned"],
    ["/settings", "sub", "pinned"],
    ["/settings/sources", "sub", "pinned"],
    ["/privacy", "root", "pinned"],
  ] as const)("%s → %s · %s", (pathname, header, scroll) => {
    expect(screenOf(pathname)).toEqual({ header, scroll })
  })

  it("표에 없는 경로는 루트 · pinned다", () => {
    expect(screenOf("/nope")).toEqual({ header: "root", scroll: "pinned" })
  })
})
