// KAMIS 재등록 감시 (ingest-schedule/09): 보존 기간 밖 재등록의 정정 판단과 원본에서 다시 만든 집계를 바꿀지 (pipeline 3-3). 순수 함수만 본다.
import { describe, expect, it } from "vitest"

import { isCorrection, rebuildVerdict, splitByRetention, type QuoteCell } from "../src/load/restore-rules.ts"

const row = (price: number, promo: Partial<{ promo_discount: boolean | null }> = {}) => ({
  price_raw: price,
  promo_discount: null,
  promo_one_plus_one: null,
  promo_from: null,
  promo_to: null,
  ...promo,
})

describe("정정인가 (isCorrection)", () => {
  it("가격이나 행사가 다르면 정정이다", () => {
    expect(isCorrection(row(1000), row(1100))).toBe(true)
    expect(isCorrection(row(1000), row(1000, { promo_discount: true }))).toBe(true)
  })

  it("값이 같으면 등록 시각만 바뀐 것이라 정정이 아니다 (kamis.md 6-2)", () => {
    expect(isCorrection(row(1000), row(1000))).toBe(false)
  })

  it("이전 값을 모르면(원본이 지워졌다) 정정 후보로 본다", () => {
    expect(isCorrection(undefined, row(1000))).toBe(true)
  })
})

describe("보존 기간으로 행 나누기 (splitByRetention)", () => {
  it("보존 시작일(오늘 2026-11-27의 90일 전)보다 오래된 날의 행을 따로 낸다", () => {
    const rows = [{ obs_date: "2026-08-28" }, { obs_date: "2026-08-29" }, { obs_date: "2026-11-26" }]
    expect(splitByRetention(rows, "2026-08-29")).toEqual({
      kept: [{ obs_date: "2026-08-29" }, { obs_date: "2026-11-26" }],
      outdated: [{ obs_date: "2026-08-28" }],
    })
  })
})

describe("다시 만든 집계로 바꿀지 (rebuildVerdict)", () => {
  const cell = (scope: string, n: number, value: number): QuoteCell => ({ price_tier: "retail", scope_key: scope, n, value })

  it("모든 범위의 표본이 지금 이상이면 바꾸고, 값이 달라졌는지 알려 준다", () => {
    const now = [cell("national", 30, 5000), cell("market_type:traditional", 10, 4800)]
    expect(rebuildVerdict(now, [cell("national", 30, 5100), cell("market_type:traditional", 10, 4800)])).toEqual({
      result: "rebuilt",
      changed: true,
    })
    expect(rebuildVerdict(now, [...now])).toEqual({ result: "rebuilt", changed: false })
  })

  it("한 범위라도 표본이 적거나 빠졌으면 불완전이라 그대로 둔다", () => {
    const now = [cell("national", 30, 5000), cell("market_type:traditional", 10, 4800)]
    expect(rebuildVerdict(now, [cell("national", 29, 5100), cell("market_type:traditional", 10, 4800)])).toEqual({
      result: "kept",
      changed: false,
    })
    expect(rebuildVerdict(now, [cell("national", 30, 5100)])).toEqual({ result: "kept", changed: false })
  })

  it("지금 집계가 없던 범위가 새로 생기면 바꾼다", () => {
    expect(rebuildVerdict([], [cell("national", 3, 5000)])).toEqual({ result: "rebuilt", changed: true })
  })
})
