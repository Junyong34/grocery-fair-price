import { TZDate } from "@date-fns/tz"
import { describe, expect, it } from "vitest"

import { seoulDateOf } from "./date-utils"
import { TIME_ZONE } from "./today"

describe("seoulDateOf", () => {
  it("UTC 15시를 넘으면 서울은 다음 날이다", () => {
    expect(seoulDateOf(Date.UTC(2026, 11, 21, 14, 59))).toEqual({ year: 2026, month: 12, day: 21 })
    expect(seoulDateOf(Date.UTC(2026, 11, 21, 15, 0))).toEqual({ year: 2026, month: 12, day: 22 })
  })

  it("소수 밀리초(천문 계산 결과)도 받는다", () => {
    expect(seoulDateOf(Date.UTC(2026, 0, 1) + 0.5)).toEqual({ year: 2026, month: 1, day: 1 })
  })

  it("2026~2050년 동안 TZDate(Asia/Seoul)와 같은 날짜를 낸다", () => {
    for (let ms = Date.UTC(2026, 0, 1); ms < Date.UTC(2051, 0, 1); ms += 7 * 3_600_000 + 13 * 60_000) {
      const tz = new TZDate(ms, TIME_ZONE)
      expect(seoulDateOf(ms)).toEqual({ year: tz.getFullYear(), month: tz.getMonth() + 1, day: tz.getDate() })
    }
  })
})
