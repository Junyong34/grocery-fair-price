import { describe, expect, it } from "vitest"

import { contractBaselineVersion, PROBES, readBaseline } from "../src/contract/probes.ts"

// 기준 파일은 라이브 실측으로 만든다 (pnpm contract:baseline). 여기서는 실측 항목과 짝이 맞는지만 본다.
describe("기준 파일 (baseline/contract-baseline.json)", () => {
  it("실측 항목과 기준 항목이 정확히 같다 (항목을 추가하면 기준도 다시 만든다)", () => {
    const baseline = readBaseline()
    expect(Object.keys(baseline.probes).sort()).toEqual(PROBES.map((p) => p.id).sort())
  })

  it("raw_object.contract_baseline에 남길 버전은 기준을 만든 시각이다", () => {
    expect(contractBaselineVersion()).toBe(`baseline:${readBaseline().capturedAt}`)
  })

  it("각 항목은 필드 타입, 코드 목록, 건수를 가진다", () => {
    const baseline = readBaseline()
    for (const [id, entry] of Object.entries(baseline.probes)) {
      expect(Object.keys(entry.shape).length, id).toBeGreaterThan(0)
      expect(typeof entry.rowCount, id).toBe("number")
      expect(entry.codes, id).toBeTypeOf("object")
    }
  })
})
