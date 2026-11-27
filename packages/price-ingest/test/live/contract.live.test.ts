import { describe, expect, it } from "vitest"

import { compareProbe } from "../../src/contract/compare.ts"
import { describeShape } from "../../src/contract/shape.ts"
import { PROBES, createLiveCall, readBaseline } from "../../src/contract/probes.ts"
import { fetchKamisPerDayAll } from "../../src/sources/kamis.ts"

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

  // 명세 밖 조건 cond[orgnl_reg_dt::GTE] (kamis.md 1장, 재등록 감시 ingest-schedule/09).
  // 먼 미래 시각이면 0건이어야 한다. 조건이 무시되면 기간 안의 행이 모두 와 클라이언트가 계약 오류로 끊는다
  it("KAMIS 등록 시각 조건이 동작한다", async () => {
    const query = { fromYmd: "20260901", toYmd: "20260930", ctgryCd: "200", itemCd: "211", seCd: "01" } as const
    expect(await fetchKamisPerDayAll(live.call, { ...query, regSince: "2099-01-01T00:00:00Z" })).toEqual([])
  })

  it("한 번 실행의 호출 수가 한도 안이다", () => {
    expect(live.calls()).toBeLessThanOrEqual(30)
  })
})
