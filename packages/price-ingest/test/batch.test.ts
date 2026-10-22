import { describe, expect, it } from "vitest"

import { adaptRows } from "../src/adapt/batch.ts"
import { adaptKamisRow, kamisRowRejection } from "../src/adapt/kamis.ts"
import { fixtureMapping, kamisBaechuRows } from "./fixtures/adapt.ts"

describe("행 묶음 변환과 행 단위 거부 (3-12 #26)", () => {
  it("거부된 행은 초안에서 빠지고, 몇 번째 행인지와 사유가 남는다", () => {
    const rows = kamisBaechuRows()
    rows[1] = { ...rows[1]!, exmn_dd_prc: "0" }
    rows[3] = { ...rows[3]!, unit_sz: "0" }
    const outcome = adaptRows(
      rows,
      (row) => kamisRowRejection(row),
      (row) => adaptKamisRow(row, { mapping: fixtureMapping }),
    )
    expect(outcome.drafts).toHaveLength(3)
    expect(outcome.rejected).toEqual([
      { index: 1, reason: "가격이 양의 정수가 아니다" },
      { index: 3, reason: "단위 크기가 양의 정수가 아니다" },
    ])
  })

  it("거부할 행이 없으면 모든 행이 초안이 된다", () => {
    const rows = kamisBaechuRows()
    const outcome = adaptRows(rows, (row) => kamisRowRejection(row), (row) => adaptKamisRow(row, { mapping: fixtureMapping }))
    expect(outcome.drafts).toHaveLength(rows.length)
    expect(outcome.rejected).toEqual([])
  })
})
