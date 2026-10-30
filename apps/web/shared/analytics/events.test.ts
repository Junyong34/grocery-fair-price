import { describe, expect, it } from "vitest"

import { EVENT_SAMPLES, REGISTERED_PARAMS, type AnalyticsEventName } from "./events"

// GA4 이벤트 · 매개변수 규칙: https://support.google.com/analytics/answer/13316687
const NAME = /^[a-z][a-z0-9_]{0,39}$/
const RESERVED_PREFIXES = ["google_", "ga_", "firebase_"]
const names = Object.keys(EVENT_SAMPLES) as AnalyticsEventName[]

describe("분석 이벤트 카탈로그", () => {
  it("이벤트 이름은 영문 소문자 · 숫자 · 밑줄, 40자 이내, 예약 접두 없음", () => {
    for (const name of names) {
      expect(name, name).toMatch(NAME)
      expect(RESERVED_PREFIXES.some((prefix) => name.startsWith(prefix)), name).toBe(false)
    }
  })

  it("매개변수 이름도 같은 규칙, 이벤트당 25개 이하, 문자열 값 100자 이하", () => {
    for (const name of names) {
      const params = Object.entries(EVENT_SAMPLES[name])
      expect(params.length, name).toBeLessThanOrEqual(25)
      for (const [param, value] of params) {
        expect(param, `${name}.${param}`).toMatch(NAME)
        expect(RESERVED_PREFIXES.some((prefix) => param.startsWith(prefix)), `${name}.${param}`).toBe(false)
        if (typeof value === "string") expect(value.length, `${name}.${param}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it("이벤트가 쓰는 매개변수는 모두 GA 맞춤 측정기준으로 등록되어 있다", () => {
    const used = [...new Set(names.flatMap((name) => Object.keys(EVENT_SAMPLES[name])))].sort()
    expect(used, "GA 관리 → 맞춤 정의 → 맞춤 측정기준(범위: 이벤트)에 등록하고 REGISTERED_PARAMS에 더한다").toEqual([...REGISTERED_PARAMS].sort())
  })
})
