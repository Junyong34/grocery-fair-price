import { describe, expect, it } from "vitest"

import { PAIRINGS, type PairingRow } from "@workspace/seasonal/data/infant-pairings"
import { paginatePairings } from "./print-layout"

describe("A4 궁합표 배치", () => {
  it("기준 재료를 3장 9열에 한 번씩 담는다", () => {
    const sheets = paginatePairings(PAIRINGS)

    expect(sheets.map((columns) => columns.length)).toEqual([3, 3, 3])
    expect(
      sheets
        .flat(2)
        .map(({ name }) => name)
        .sort()
    ).toEqual(PAIRINGS.map(({ name }) => name).sort())
  })

  it("긴 O·X 목록이 있는 재료부터 여러 장에 나눠 놓는다", () => {
    const rows: PairingRow[] = Array.from({ length: 12 }, (_, index) => ({
      id: `item-${index}`,
      name: `재료 ${index}`,
      category: "채소",
      good: Array.from({ length: index < 3 ? 16 : 1 }, () => "표고버섯"),
      bad: [],
    }))

    expect(
      paginatePairings(rows).map(
        (columns) =>
          columns.flat().filter(({ good }) => good.length === 16).length
      )
    ).toEqual([1, 1, 1])
  })
})
