import { describe, expect, it } from "vitest"

import { basketView } from "./basket"
import type { VarietySummary, VerdictKind } from "./types"

const row = (id: string, kind: VerdictKind, pct: number | null): VarietySummary => ({
  id,
  name: id,
  item: id,
  category: "채소",
  spec: null,
  baseUnit: "1개",
  price: 1000,
  usual: pct == null ? null : 1000,
  verdict: { kind, pct },
  surveyedOn: "2026-10-23",
  sampleSize: 45,
  stale: false,
  meetsMinN: true,
})
const VARIETIES = [
  row("배추", "normal", 8),
  row("대파", "pricey", 24),
  row("고등어", "cheap", -15),
  row("계란", "normal", 5),
  row("샤인머스켓", "none", null),
  row("사과", "pricey", 19),
]
const entry = (id: string, verdict: VerdictKind, on = "2026-10-23") => ({ id, verdict, on })

describe("basketView", () => {
  const view = basketView(VARIETIES, [
    entry("배추", "normal"),
    entry("대파", "pricey"),
    entry("고등어", "normal", "2026-10-16"),
    entry("계란", "normal"),
    entry("샤인머스켓", "none"),
  ])

  it("판정별로 묶고(싸요 → 보통 → 비싸요 → 판정 전) 묶음 안은 % 오름차순", () => {
    expect(view.groups.map((g) => [g.kind, g.items.map((i) => i.variety.id)])).toEqual([
      ["cheap", ["고등어"]],
      ["normal", ["계란", "배추"]],
      ["pricey", ["대파"]],
      ["none", ["샤인머스켓"]],
    ])
  })

  it("판정별 개수. 판정 전은 0이면 뺀다", () => {
    expect(view.tally).toEqual([
      { kind: "cheap", count: 1 },
      { kind: "normal", count: 2 },
      { kind: "pricey", count: 1 },
      { kind: "none", count: 1 },
    ])
    const noNone = basketView(VARIETIES, [entry("배추", "normal")])
    expect(noNone.tally.map((t) => t.kind)).toEqual(["cheap", "normal", "pricey"])
  })

  it("담은 뒤 판정이 바뀐 품종", () => {
    expect(view.changed.map((i) => [i.variety.id, i.addedVerdict, i.addedOn])).toEqual([["고등어", "normal", "2026-10-16"]])
  })

  it("목록에 없는 품종은 건너뛴다", () => {
    expect(basketView(VARIETIES, [entry("트러플", "none")]).count).toBe(0)
  })
})
