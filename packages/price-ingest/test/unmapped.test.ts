import { describe, expect, it } from "vitest"

import { adaptEkapeRow } from "../src/adapt/ekape.ts"
import { adaptKamisRow } from "../src/adapt/kamis.ts"
import { unmappedReport } from "../src/adapt/mapping.ts"
import { ekapePorkRows, fixtureMapping, first, kamisBaechuRows } from "./fixtures/adapt.ts"

const ctx = { mapping: fixtureMapping, requestedYmd: "20261011" }

describe("미매핑 건수 리포트", () => {
  it("품종에 연결되지 않은 원천 키를 건수와 함께 모은다 (많은 순)", () => {
    const row = first(kamisBaechuRows())
    const drafts = [
      adaptKamisRow({ ...row, item_cd: "999" }, ctx),
      adaptKamisRow({ ...row, item_cd: "999", mrkt_cd: "0110403" }, ctx),
      adaptKamisRow({ ...row, item_cd: "888" }, ctx),
    ]
    expect(unmappedReport(drafts)).toEqual([
      { source: "kamis", sourceKey: "01-200-999-02-04", count: 2 },
      { source: "kamis", sourceKey: "01-200-888-02-04", count: 1 },
    ])
  })

  it("매핑된 키는 리포트에 없다", () => {
    const drafts = kamisBaechuRows().map((row) => adaptKamisRow(row, ctx))
    expect(unmappedReport(drafts)).toEqual([])
  })

  it("평년 행의 미매핑도 센다", () => {
    const drafts = ekapePorkRows().map((row) => adaptEkapeRow({ ...row, itemCd: "68" }, ctx))
    expect(unmappedReport(drafts)).toEqual([{ source: "ekape", sourceKey: "4304-68-구분없음", count: 2 }])
  })
})
