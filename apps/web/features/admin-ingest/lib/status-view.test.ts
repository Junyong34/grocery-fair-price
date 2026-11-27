import { describe, expect, it } from "vitest"

import { dayGrid, summarizeSources, type DayRow } from "./status-view"

const day = (source: DayRow["source"], date: string, status: DayRow["status"], over: Partial<DayRow> = {}): DayRow => ({
  source,
  day: date,
  status,
  rowCount: status === "ok" ? 10 : 0,
  attempts: 1,
  correctionCount: 0,
  ...over,
})

describe("날짜 칸 (dayGrid)", () => {
  it("출처마다 오늘 전 N일을 오래된 날부터 칸으로 늘어놓고, 기록이 없는 날은 none이다", () => {
    const grid = dayGrid([day("kamis", "2026-11-26", "ok"), day("kamis", "2026-11-24", "pending")], "2026-11-27", 3)
    expect(grid.days).toEqual(["2026-11-24", "2026-11-25", "2026-11-26"])
    expect(grid.rows.find((r) => r.source === "kamis")!.cells.map((c) => c.status)).toEqual(["pending", "none", "ok"])
    expect(grid.rows.map((r) => r.source)).toEqual(["kamis", "ekape", "chamga"])
  })
})

describe("출처 요약 (summarizeSources)", () => {
  it("마지막 정상 날짜와 끝나지 않은 날 수, 정정 수를 센다", () => {
    const rows = [
      day("kamis", "2026-11-26", "ok", { correctionCount: 2 }),
      day("kamis", "2026-11-25", "partial", { rowCount: 5 }),
      day("kamis", "2026-11-20", "empty_unexpected", { attempts: 3 }),
      day("ekape", "2026-11-25", "failed"),
    ]
    const lastOk = new Map([
      ["kamis", "2026-11-26"],
      ["ekape", "2026-11-24"],
      ["chamga", null],
    ])
    expect(summarizeSources(rows, lastOk)).toEqual([
      { source: "kamis", lastOk: "2026-11-26", unsettled: 2, corrections: 2 },
      { source: "ekape", lastOk: "2026-11-24", unsettled: 1, corrections: 0 },
      { source: "chamga", lastOk: null, unsettled: 0, corrections: 0 },
    ])
  })
})
