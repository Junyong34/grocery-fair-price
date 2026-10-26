// 참가격 조사일 감지·완료 규칙 (chamgagyeok.md 5-4, ingest-schedule/10)
import { describe, expect, it } from "vitest"

import {
  emptyCloseDue,
  isComplete,
  nextStableChecks,
  recentFridays,
  surveyDayAction,
  type SurveyDayState,
} from "../src/ingest/chamga-schedule.ts"

const open = (over: Partial<SurveyDayState> = {}): SurveyDayState => ({
  status: "ok",
  closedAt: null,
  stableChecks: 0,
  rowCount: 100,
  maxRegisteredAt: "2026-10-15T09:00:00Z",
  ...over,
})

describe("최근 금요일", () => {
  it("오늘을 포함해 그 전의 금요일 2개 (새 것부터)", () => {
    expect(recentFridays("2026-10-23")).toEqual(["2026-10-23", "2026-10-16"]) // 금요일 당일
    expect(recentFridays("2026-10-27")).toEqual(["2026-10-23", "2026-10-16"]) // 화요일
    expect(recentFridays("2026-10-22")).toEqual(["2026-10-16", "2026-10-09"]) // 목요일
  })
})

describe("완료 판단: 행 수가 두 번 연속 같고 마지막 등록이 하루 넘게 지났다", () => {
  const now = "2026-10-20T00:00:00Z"
  it.each([
    [open({ stableChecks: 1, maxRegisteredAt: "2026-10-18T23:00:00Z" }), true],
    [open({ stableChecks: 0, maxRegisteredAt: "2026-10-18T23:00:00Z" }), false], // 행 수가 아직 바뀌는 중
    [open({ stableChecks: 1, maxRegisteredAt: "2026-10-19T01:00:00Z" }), false], // 마지막 등록이 하루 안
    [open({ stableChecks: 2, maxRegisteredAt: null }), false],
  ])("%#", (state, complete) => {
    expect(isComplete(state, now)).toBe(complete)
  })

  it("받은 뒤 행 수가 그대로면 하나 올리고, 바뀌면 0으로", () => {
    expect(nextStableChecks(open({ stableChecks: 1 }), 100)).toBe(2)
    expect(nextStableChecks(open({ stableChecks: 1 }), 130)).toBe(0)
    expect(nextStableChecks(undefined, 0)).toBe(0) // 처음 받음
  })
})

describe("조사일마다 할 일", () => {
  const now = "2026-10-21T22:00:00Z" // 화요일 07:00 KST
  it.each([
    ["기록 없음 → 감지", undefined, "2026-10-22", "detect"],
    ["아직 안 옴(pending) → 감지", open({ status: "pending", rowCount: 0, maxRegisteredAt: null }), "2026-10-22", "detect"],
    ["닫힘 → 건너뜀", open({ closedAt: "2026-10-19T22:00:00Z" }), "2026-10-22", "skip"],
    ["들어오는 중 → 전체 수집", open({ stableChecks: 0 }), "2026-10-22", "fetch"],
    ["완료, 월요일 아님 → 건너뜀", open({ stableChecks: 1, maxRegisteredAt: "2026-10-15T09:00:00Z" }), "2026-10-22", "skip"],
    ["완료, 월요일 → 마지막으로 한 번 더", open({ stableChecks: 1, maxRegisteredAt: "2026-10-15T09:00:00Z" }), "2026-10-26", "final"],
  ] as const)("%s", (_name, state, today, action) => {
    expect(surveyDayAction(state, today, now)).toBe(action)
  })

  it("금요일 뒤 10일이 지나야 빈 조사일로 닫는다 (격주 달력은 근거로 쓰지 않는다)", () => {
    expect(emptyCloseDue("2026-10-16", "2026-10-25")).toBe(false)
    expect(emptyCloseDue("2026-10-16", "2026-10-26")).toBe(true)
  })
})
