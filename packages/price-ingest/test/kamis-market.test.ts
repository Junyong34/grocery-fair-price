import { describe, expect, it } from "vitest"

import { isOfficialKamisMarket, kamisMarketType } from "../src/load/kamis-market.ts"

// kamis.md 5-1 표의 예
describe("KAMIS 시장 유형", () => {
  it.each([
    ["0110403", "C-유통", "large_retail"],
    ["0110404", "B`-유통", "large_retail"],
    ["0900040", "M'-유통", "large_retail"],
    ["0110499", "BB1-유통", "large_retail"],
    ["0400001", "A-생협", "eco_channel"],
    ["0400002", "C-SSM", "eco_channel"],
    ["0400003", "R-마트", "eco_channel"],
    ["0110211", "가락도매", "wholesale"],
    ["1000001", "온라인몰A", "online"],
    ["1000004", "옥션", "online"],
    ["0110200", "서울", "other"],
    ["1000006", "가락소매", "other"],
    ["0110212", "경동", "traditional"],
    ["0360402", "역전", "traditional"],
  ])("%s %s → %s", (code, name, type) => {
    expect(kamisMarketType(code, name)).toBe(type)
  })
})

describe("KAMIS 코드표의 시장", () => {
  it("코드표에 있는 시장과 응답에만 오는 시장을 가른다 (kamis.md 3장)", () => {
    expect(isOfficialKamisMarket("0110212")).toBe(true)
    expect(isOfficialKamisMarket("0210405")).toBe(false) // K-유통(부산), 코드표에 없는데 실제로 온다
  })
})
