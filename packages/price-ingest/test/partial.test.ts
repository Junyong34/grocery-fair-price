// KAMIS 일부만 옴 (pipeline 5-2, ingest-foundation/05): 품목별 건수를 최근 4주 같은 요일 평균과 비교한다. 순수 함수만 본다.
import { describe, expect, it } from "vitest"

import { baselineOf, judgeItems, SAME_WEEKDAY_WEEKS } from "../src/ingest/partial.ts"

describe("기준값 (baselineOf): 최근 4주 같은 요일의 정상 건수 평균", () => {
  const day = "2026-11-20" // 금
  it("7·14·21·28일 전 ok인 날만 평균한다", () => {
    const history = [
      { day: "2026-11-13", item: "211", rows: 40, status: "ok" as const },
      { day: "2026-11-06", item: "211", rows: 50, status: "ok" as const },
      { day: "2026-10-30", item: "211", rows: 0, status: "missing" as const }, // 빠진 날은 기준을 끌어내리지 않는다
      { day: "2026-10-23", item: "211", rows: 60, status: "ok" as const },
      { day: "2026-11-19", item: "211", rows: 99, status: "ok" as const }, // 다른 요일
      { day: "2026-10-16", item: "211", rows: 99, status: "ok" as const }, // 5주 전
    ]
    expect(SAME_WEEKDAY_WEEKS).toBe(4)
    expect(baselineOf(history, day)).toEqual(new Map([["211", 50]]))
  })
})

describe("품목 판정 (judgeItems)", () => {
  const baselines = new Map([
    ["211", 40],
    ["212", 30],
    ["4301", 70],
  ])

  it("기준의 50% 미만이면 일부만 옴, 0건이면 빠짐, 그날은 partial", () => {
    const result = judgeItems(
      [
        { item: "211", livestock: false, rows: 19 },
        { item: "4301", livestock: true, rows: 70 },
      ],
      baselines,
      0.5,
    )
    expect(result.holiday).toBe(false)
    expect(result.partial).toBe(true)
    expect(result.parts).toEqual([
      { item: "211", rows: 19, baseline: 40, status: "partial" },
      { item: "212", rows: 0, baseline: 30, status: "missing" },
      { item: "4301", rows: 70, baseline: 70, status: "ok" },
    ])
  })

  it("기준의 절반 이상이면 ok, 기준이 없는 품목(처음 본 품목)은 ok", () => {
    const result = judgeItems(
      [
        { item: "211", livestock: false, rows: 20 },
        { item: "212", livestock: false, rows: 30 },
        { item: "999", livestock: false, rows: 3 },
        { item: "4301", livestock: true, rows: 70 },
      ],
      baselines,
      0.5,
    )
    expect(result.partial).toBe(false)
    expect(result.parts.find((p) => p.item === "999")).toEqual({ item: "999", rows: 3, baseline: null, status: "ok" })
  })

  it("소매(축산 제외)가 모두 0건이면 휴일·주말이다: 판정하지 않고 온 품목만 남긴다 (kamis.md 7장)", () => {
    const result = judgeItems([{ item: "4301", livestock: true, rows: 70 }], baselines, 0.5)
    expect(result).toEqual({ holiday: true, partial: false, parts: [{ item: "4301", rows: 70, baseline: 70, status: "ok" }] })
  })
})
