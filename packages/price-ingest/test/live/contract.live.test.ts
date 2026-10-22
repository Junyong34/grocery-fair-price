import { describe, expect, it } from "vitest"

import { compareProbe } from "../../src/contract/compare.ts"
import { describeShape } from "../../src/contract/shape.ts"
import { PROBES, createLiveCall, readBaseline } from "../../src/contract/probes.ts"

// 실제 공공 API를 부른다. 한 번 실행에 약 16회 호출하므로 수집 시각 앞뒤로 돌리지 않는다 (pipeline.md 5-3-1).
const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY
if (!serviceKey) throw new Error("DATA_GO_KR_SERVICE_KEY가 없다. 루트 .env에 넣는다.")

const live = createLiveCall(serviceKey)
const baseline = readBaseline()

describe("실측 계약 (라이브)", () => {
  it.each(PROBES.map((probe) => [probe.id, probe] as const))("%s", async (_id, probe) => {
    const raw = await probe.fetchRaw(live.call)
    const verdict = compareProbe(
      probe.id,
      { shape: describeShape(raw), codes: probe.codes(raw), rowCount: probe.rows(raw).length },
      baseline.probes[probe.id],
    )
    for (const warning of verdict.warnings) console.warn(warning)
    expect([...probe.check(raw), ...verdict.failures]).toEqual([])
  })

  it("한 번 실행의 호출 수가 한도 안이다", () => {
    expect(live.calls()).toBeLessThanOrEqual(30)
  })
})
