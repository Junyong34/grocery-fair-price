import { describe, expect, it } from "vitest"

import { compareProbe, type ProbeBaseline } from "../src/contract/compare.ts"
import { describeShape } from "../src/contract/shape.ts"

describe("describeShape: 응답의 경로별 타입", () => {
  it("중첩 객체와 배열의 경로마다 타입을 모은다", () => {
    expect(describeShape({ a: { b: "x", c: [{ d: 1, e: null }] } })).toEqual({
      a: ["object"],
      "a.b": ["string"],
      "a.c": ["array"],
      "a.c[]": ["object"],
      "a.c[].d": ["number"],
      "a.c[].e": ["null"],
    })
  })

  it("같은 경로에 여러 타입이 섞이면 모두 적는다", () => {
    expect(describeShape({ rows: [{ x: "1" }, { x: null }] })["rows[].x"]).toEqual(["null", "string"])
  })
})

const BASE: ProbeBaseline = {
  shape: { rows: ["array"], "rows[].price": ["string"], "rows[].name": ["string"] },
  codes: { unit: ["kg", "포기"] },
  rowCount: 100,
}

function observed(over: Partial<ProbeBaseline>): ProbeBaseline {
  return { ...BASE, ...over }
}

describe("compareProbe: 기준과 실측 비교", () => {
  it("같으면 실패도 경고도 없다", () => {
    expect(compareProbe("p", observed({}), BASE)).toEqual({ failures: [], warnings: [] })
  })

  it("타입이 바뀌면 실패이고, 경로와 전후 타입을 보여준다", () => {
    const verdict = compareProbe("p", observed({ shape: { ...BASE.shape, "rows[].price": ["number"] } }), BASE)
    expect(verdict.failures).toHaveLength(1)
    expect(verdict.failures[0]).toContain("rows[].price")
    expect(verdict.failures[0]).toContain("string → number")
  })

  it("사라진 코드는 실패, 새로 생긴 코드는 경고다", () => {
    const removed = compareProbe("p", observed({ codes: { unit: ["포기"] } }), BASE)
    expect(removed.failures.join("\n")).toContain("kg")
    const added = compareProbe("p", observed({ codes: { unit: ["kg", "포기", "개"] } }), BASE)
    expect(added.failures).toEqual([])
    expect(added.warnings.join("\n")).toContain("개")
  })

  it("건수가 기준의 10% 넘게 달라지면 실패다", () => {
    expect(compareProbe("p", observed({ rowCount: 85 }), BASE).failures.join("\n")).toContain("건수")
    expect(compareProbe("p", observed({ rowCount: 95 }), BASE).failures).toEqual([])
  })

  it("필드가 사라지거나 새로 생기면 경고만 한다 (계약 스키마가 따로 실패시킨다)", () => {
    const verdict = compareProbe(
      "p",
      observed({ shape: { rows: ["array"], "rows[].price": ["string"], "rows[].extra": ["string"] } }),
      BASE,
    )
    expect(verdict.failures).toEqual([])
    expect(verdict.warnings.join("\n")).toContain("rows[].name")
    expect(verdict.warnings.join("\n")).toContain("rows[].extra")
  })

  it("기준이 없으면 실패다", () => {
    const verdict = compareProbe("p", observed({}), undefined)
    expect(verdict.failures.join("\n")).toContain("기준")
  })
})
