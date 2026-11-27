// 빈 날 메우기와 source_day 상태 규칙 (ingest-schedule/08, pipeline 3-5·5-2). 순수 함수만 본다.
import { describe, expect, it } from "vitest"

import { addDays } from "../src/ingest/collect.ts"
import { EKAPE_GAP_DAYS_PER_RUN, FILL_GAP_DAYS, gapDays, nextDayState, windowDays, type DayState } from "../src/ingest/fill-gaps.ts"

const D = "2026-11-20" // 기준일 (금)

function states(entries: [string, DayState["status"], number?][]): Map<string, DayState> {
  return new Map(entries.map(([day, status, attempts]) => [day, { status, attempts: attempts ?? 1, rowCount: status === "ok" ? 10 : 0 }]))
}

describe("다시 받을 날 고르기 (gapDays)", () => {
  // 매일 수집이 받는 D-3~D-1 밖, D-14~D-4 안의 날만 본다
  const allOk = () => states(Array.from({ length: FILL_GAP_DAYS }, (_, i) => [addDays(D, -(i + 1)), "ok"] as [string, "ok"]))

  it("모두 ok면 다시 받을 날이 없다", () => {
    expect(gapDays(D, allOk())).toEqual([])
  })

  it("하루 빠진 실행 뒤: 기록이 없는 날을 다시 받는다", () => {
    const s = allOk()
    s.delete("2026-11-12")
    expect(gapDays(D, s)).toEqual(["2026-11-12"])
  })

  it("아직 안 옴·실패·일부만 옴은 다시 받고, 오래된 날부터 준다", () => {
    const s = allOk()
    s.set("2026-11-15", { status: "failed", attempts: 0, rowCount: 0 })
    s.set("2026-11-08", { status: "pending", attempts: 1, rowCount: 0 })
    s.set("2026-11-10", { status: "partial", attempts: 1, rowCount: 3 })
    expect(gapDays(D, s)).toEqual(["2026-11-08", "2026-11-10", "2026-11-15"])
  })

  it("휴일(empty_expected)과 닫힌 빈 날(empty_unexpected)은 다시 받지 않는다", () => {
    const s = allOk()
    s.set("2026-11-09", { status: "empty_expected", attempts: 1, rowCount: 0 })
    s.set("2026-11-11", { status: "empty_unexpected", attempts: 3, rowCount: 0 })
    expect(gapDays(D, s)).toEqual([])
  })

  it("D-3~D-1과 14일보다 오래된 날은 고르지 않는다 (매일 수집이 받거나 기간 밖이다)", () => {
    const s = allOk()
    for (const day of [addDays(D, -1), addDays(D, -3), addDays(D, -15)]) s.delete(day)
    expect(gapDays(D, s)).toEqual([])
  })

  it("max로 개수를 줄인다 (축평원 호출 예산)", () => {
    expect(gapDays(D, new Map(), { max: EKAPE_GAP_DAYS_PER_RUN })).toEqual(["2026-11-06", "2026-11-07"])
  })
})

describe("받을 날 목록 (windowDays)", () => {
  it("매일 D-3~D-1에 다시 받을 날을 더해 날짜순으로 준다", () => {
    expect(windowDays(D, 3, ["2026-11-10"])).toEqual(["2026-11-10", "2026-11-17", "2026-11-18", "2026-11-19"])
  })
})

describe("한 번 확인한 뒤의 상태 (nextDayState)", () => {
  const day = "2026-11-17"
  const base = { day, today: "2026-11-18", rowCount: 0, clean: true, current: null as DayState | null }

  it("행이 왔으면 ok. 아직 안 옴·실패·와야 하는데 빔이었던 날도 ok가 된다", () => {
    for (const status of [null, "pending", "failed", "empty_unexpected"] as const) {
      const current = status === null ? null : { status, attempts: 2, rowCount: 0 }
      expect(nextDayState({ ...base, rowCount: 5, current }).status).toBe("ok")
    }
  })

  it("행이 없고 호출이 깨끗하면 아직 안 옴(pending)이고 확인 횟수가 는다", () => {
    expect(nextDayState(base)).toEqual({ status: "pending", attempts: 1 })
    expect(nextDayState({ ...base, current: { status: "pending", attempts: 1, rowCount: 0 } })).toEqual({ status: "pending", attempts: 2 })
  })

  it("3번 확인하고 3일이 지나도 없으면 와야 하는데 빔(empty_unexpected)", () => {
    const current: DayState = { status: "pending", attempts: 2, rowCount: 0 }
    expect(nextDayState({ ...base, today: addDays(day, 3), current })).toEqual({ status: "empty_unexpected", attempts: 3 })
  })

  it("3번 확인해도 3일이 안 지났으면 아직 기다린다 (같은 날 두 번 돈 실행)", () => {
    const current: DayState = { status: "pending", attempts: 2, rowCount: 0 }
    expect(nextDayState({ ...base, today: addDays(day, 2), current })).toEqual({ status: "pending", attempts: 3 })
  })

  it("3일이 지나도 확인이 3번이 안 되면 기다린다 (실행이 빠진 날)", () => {
    const current: DayState = { status: "pending", attempts: 1, rowCount: 0 }
    expect(nextDayState({ ...base, today: addDays(day, 6), current })).toEqual({ status: "pending", attempts: 2 })
  })

  it("호출이 깨끗하지 않으면 실패(failed)로 두고 확인 횟수는 세지 않는다", () => {
    const current: DayState = { status: "pending", attempts: 2, rowCount: 0 }
    expect(nextDayState({ ...base, clean: false, today: addDays(day, 5), current })).toEqual({ status: "failed", attempts: 2 })
  })

  it("휴일(empty_expected)·일부만 옴(partial)처럼 판정이 끝난 상태는 그대로 둔다", () => {
    expect(nextDayState({ ...base, current: { status: "empty_expected", attempts: 1, rowCount: 0 } }).status).toBe("empty_expected")
    expect(nextDayState({ ...base, rowCount: 4, current: { status: "partial", attempts: 1, rowCount: 4 } }).status).toBe("partial")
  })

  it("닫힌 빈 날은 다시 확인해도 행이 없으면 그대로다", () => {
    const current: DayState = { status: "empty_unexpected", attempts: 3, rowCount: 0 }
    expect(nextDayState({ ...base, today: addDays(day, 9), current })).toEqual({ status: "empty_unexpected", attempts: 4 })
  })
})
