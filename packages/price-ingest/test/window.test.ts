import { describe, expect, it } from "vitest"

import { dayPrefix, kstDateOf, missingKeys, RECONCILE_DAYS, recentDays } from "../src/load/window.ts"

describe("대조 기간 (7일, KST 폴더 날짜)", () => {
  it("기본 대조 기간은 7일이다 (2026-10-22 결정)", () => {
    expect(RECONCILE_DAYS).toBe(7)
  })

  it("오늘부터 과거 7일의 날짜를 최신순으로 준다", () => {
    expect(recentDays("2026-10-22")).toEqual([
      "2026-10-22",
      "2026-10-21",
      "2026-10-20",
      "2026-10-19",
      "2026-10-18",
      "2026-10-17",
      "2026-10-16",
    ])
  })

  it("달이 바뀌어도 날짜가 맞다", () => {
    expect(recentDays("2026-11-02", 3)).toEqual(["2026-11-02", "2026-11-01", "2026-10-31"])
  })

  it("시각을 KST 날짜로 바꾼다 (폴더 날짜는 KST 수집일이다, pipeline 3-7)", () => {
    expect(kstDateOf("2026-10-21T16:30:00Z")).toBe("2026-10-22")
    expect(kstDateOf("2026-10-21T14:59:59Z")).toBe("2026-10-21")
  })

  it("날짜 폴더 접두사는 출처/연/월/일/ 이다", () => {
    expect(dayPrefix("kamis", "2026-10-22")).toBe("kamis/2026/10/22/")
  })

  it("저장소에 있으나 기록이 없는 키만 남긴다 (정렬)", () => {
    expect(missingKeys(["kamis/b.ndjson.gz", "kamis/a.ndjson.gz", "kamis/c.ndjson.gz"], new Set(["kamis/b.ndjson.gz"]))).toEqual(
      ["kamis/a.ndjson.gz", "kamis/c.ndjson.gz"],
    )
  })
})
