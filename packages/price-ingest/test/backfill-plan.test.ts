import { describe, expect, it } from "vitest"

import { BACKFILL_YEARS, backfillItems, backfillTasks, taskRange } from "../src/backfill/plan.ts"
import { kamisTarget } from "../src/catalog/match.ts"

describe("KAMIS 백필 작업 목록 (ingest-foundation/04)", () => {
  it("기본은 3년이다 (2026-10-27 결정)", () => {
    expect(BACKFILL_YEARS).toBe(3)
  })

  it("카탈로그에서 KAMIS가 대표인 품목만 받는다", () => {
    const codes = backfillItems().map((item) => item.itemCd)
    expect(codes).toContain("211") // 배추
    expect(codes).toContain("4301") // 소: 1++등급은 축평원에 없어 KAMIS가 대표다
    expect(codes).not.toContain("4304") // 돼지: 모든 규격이 축평원 대표
    expect(codes).not.toContain("351") // 국화: 카탈로그에 없다
    expect(new Set(codes).size).toBe(codes.length)
    expect(kamisTarget({ se_cd: "01", item_cd: "4304", vrty_cd: "27", grd_cd: "1" })?.role).toBe("secondary")
  })

  it("품목 × 연도 묶음을 최근 해부터 늘어놓고, 첫 해는 3년 전 1월 1일부터다", () => {
    const tasks = backfillTasks("2026-10-28")
    const cabbage = tasks.filter((task) => task.item.itemCd === "211").map((task) => task.taskKey)
    expect(cabbage).toEqual(["kamis:01-211:2026", "kamis:01-211:2025", "kamis:01-211:2024", "kamis:01-211:2023"])
    expect(tasks.length).toBe(backfillItems().length * 4)
    // 최근 해의 묶음이 모두 앞에 온다 (예산이 모자라도 계절비율의 최근 해와 90일 관측값부터 채운다)
    expect(tasks.slice(0, backfillItems().length).every((task) => task.year === 2026)).toBe(true)
  })

  it("올해 묶음은 어제까지, 지난해 묶음은 12월 31일까지다", () => {
    expect(taskRange(2026, "2026-10-28")).toEqual({ from: "2026-01-01", to: "2026-10-27" })
    expect(taskRange(2025, "2026-10-28")).toEqual({ from: "2025-01-01", to: "2025-12-31" })
    expect(taskRange(2026, "2026-01-01")).toBeNull()
  })

  it("1월 1일에는 올해 묶음이 없다", () => {
    const years = new Set(backfillTasks("2026-01-01").map((task) => task.year))
    expect([...years]).toEqual([2025, 2024, 2023])
  })

  it("품목을 고르면 그 품목만 준다", () => {
    const tasks = backfillTasks("2026-10-28", { items: ["211", "411"] })
    expect(new Set(tasks.map((task) => task.item.itemCd))).toEqual(new Set(["211", "411"]))
    expect(() => backfillTasks("2026-10-28", { items: ["351"] })).toThrow(/351/)
  })
})
