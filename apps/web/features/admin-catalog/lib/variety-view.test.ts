import { describe, expect, it } from "vitest"

import { screenStateOf, seasonalCoverage, similarVarieties, summarize, type VarietyRow } from "./variety-view"

const row = (over: Partial<VarietyRow>): VarietyRow => ({
  slug: "apple",
  name: "사과",
  status: "active",
  category: "과일",
  item: "사과",
  specs: 1,
  keys: { kamis: 1, ekape: 0, chamga: 0 },
  seasonal: [],
  judgment: { verdict: "cheap", pct: -12, surveyedOn: "2026-11-06" },
  ...over,
})

describe("화면 상태", () => {
  it("숨김 → 판정 묶음에 없음(시세 없음) → 판정 전 → 노출 순으로 가른다", () => {
    expect(screenStateOf(row({ status: "hidden" }))).toBe("hidden")
    expect(screenStateOf(row({ judgment: null }))).toBe("no-quote")
    expect(screenStateOf(row({ judgment: { verdict: "none", pct: null, surveyedOn: "2026-11-06" } }))).toBe("before-verdict")
    expect(screenStateOf(row({}))).toBe("shown")
  })

  it("상태별 수와 pending 수를 센다", () => {
    const rows = [row({}), row({ slug: "b", judgment: null }), row({ slug: "c", status: "hidden" })]
    expect(summarize(rows, 4)).toEqual({ total: 3, shown: 1, beforeVerdict: 0, noQuote: 1, hidden: 1, pending: 4 })
  })
})

describe("pending 원천 키의 비슷한 식재료", () => {
  const rows = [row({ slug: "mackerel", name: "고등어" }), row({ slug: "mackerel-frozen", name: "고등어(냉동)" }), row({ slug: "squid", name: "물오징어" })]

  it("원문 이름의 첫 마디(품목)가 식재료 이름과 겹치면 후보로 낸다", () => {
    expect(similarVarieties("고등어/국산(신선 냉장)/中", rows).map((r) => r.slug)).toEqual(["mackerel", "mackerel-frozen"])
    expect(similarVarieties("물오징어/연근해(냉동)/中", rows).map((r) => r.slug)).toEqual(["squid"])
    expect(similarVarieties("멜론/멜론/중품", rows)).toEqual([])
    expect(similarVarieties(null, rows)).toEqual([])
  })
})

describe("제철 연결", () => {
  const foods = [
    { id: "sesame-seed", name: "참깨", category: "곡물·견과" },
    { id: "apple", name: "사과", category: "과일" },
    { id: "pear", name: "배", category: "과일" },
  ]

  it("제철 분류마다 제철 품종과 묶인 시세 식재료를 내고, 연결 없는 제철 품종도 남긴다", () => {
    const rows = [
      row({ slug: "sesame-kr", name: "참깨(국산)", seasonal: ["sesame-seed"] }),
      row({ slug: "sesame-cn", name: "참깨(중국)", seasonal: ["sesame-seed"] }),
      row({ slug: "apple", name: "사과", seasonal: ["apple"] }),
    ]
    expect(seasonalCoverage(rows, foods)).toEqual([
      {
        category: "곡물·견과",
        linked: 1,
        foods: [{ id: "sesame-seed", name: "참깨", varieties: [{ slug: "sesame-kr", name: "참깨(국산)" }, { slug: "sesame-cn", name: "참깨(중국)" }] }],
      },
      {
        category: "과일",
        linked: 1,
        foods: [
          { id: "apple", name: "사과", varieties: [{ slug: "apple", name: "사과" }] },
          { id: "pear", name: "배", varieties: [] },
        ],
      },
    ])
  })
})
