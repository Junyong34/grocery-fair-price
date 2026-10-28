// 수집 호출 정책과 출처별 호출 계획 (ingest-schedule/07). 가짜 응답으로만 돈다.
import { describe, expect, it } from "vitest"

import { parseRequest } from "../src/cli.ts"
import { ApiContractError, ApiGatewayError, ApiHttpError, ApiTransportError } from "../src/errors.ts"
import { callWithPolicy, CallBudget, classify, SourceStopped } from "../src/ingest/calls.ts"
import { addDays, collectChamga, collectEkape, collectKamis, EKAPE_JUDGE_KINDS } from "../src/ingest/collect.ts"
import { KAMIS_ITEMS } from "../src/ingest/kamis-items.ts"
import type { FetchLike } from "../src/http.ts"
import { FAKE_KEY, readSampleText } from "./helpers.ts"
import { fakeKamis, KEY_ERROR_BODY, syntheticKamisRows, type FakeCall } from "./fixtures/fake-api.ts"

const noSleep = async () => {}

function ctx(fetch: FetchLike, budget = 8_000, sleeps: number[] = []) {
  return {
    serviceKey: FAKE_KEY,
    fetch,
    budget: new CallBudget(budget),
    sleep: async (ms: number) => {
      sleeps.push(ms)
    },
  }
}

describe("오류 분류 (kamis.md 10장, pipeline 5-2)", () => {
  it.each([
    [new ApiGatewayError("kamis", "SERVICE_KEY_IS_NOT_REGISTERED_ERROR", "30"), { kind: "stop", reason: "key_invalid" }],
    [new ApiGatewayError("kamis", "DEADLINE_HAS_EXPIRED_ERROR", "31"), { kind: "stop", reason: "key_invalid" }],
    [new ApiGatewayError("kamis", "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR", "22"), { kind: "stop", reason: "quota_exceeded" }],
    [new ApiGatewayError("kamis", "NO_OPENAPI_SERVICE_ERROR", "12"), { kind: "stop", reason: "service_missing" }],
    [new ApiGatewayError("kamis", "HTTP_ERROR", "04"), { kind: "fail" }],
    [new ApiGatewayError("kamis", "APPLICATION_ERROR", "01"), { kind: "retry" }],
    [new ApiHttpError("kamis", 403), { kind: "stop", reason: "key_invalid" }],
    [new ApiHttpError("kamis", 503), { kind: "retry" }],
    [new ApiHttpError("kamis", 404), { kind: "fail" }],
    [new ApiTransportError("kamis"), { kind: "retry" }],
    [new ApiContractError("kamis", ["x"]), { kind: "fail" }],
  ] as const)("%s", (error, verdict) => {
    expect(classify(error)).toEqual(verdict)
  })

  it("예상 밖 오류(코드 버그)는 그대로 던진다", () => {
    expect(() => classify(new TypeError("bug"))).toThrow(TypeError)
  })
})

describe("호출 정책", () => {
  it("연결 실패는 2s·4s·8s 쉬고 세 번 다시 부른 뒤 실패한다", async () => {
    const sleeps: number[] = []
    let attempts = 0
    const budget = new CallBudget(100)
    const run = () => {
      attempts += 1
      budget.count()
      return Promise.reject(new ApiTransportError("kamis"))
    }
    await expect(callWithPolicy(run, { budget, sleep: async (ms) => void sleeps.push(ms) })).rejects.toBeInstanceOf(ApiTransportError)
    expect(attempts).toBe(4)
    expect(sleeps).toEqual([2_000, 4_000, 8_000])
  })

  it("다시 부르다 성공하면 그 값을 돌려준다", async () => {
    let attempts = 0
    const run = () => (++attempts < 3 ? Promise.reject(new ApiHttpError("kamis", 502)) : Promise.resolve("ok"))
    expect(await callWithPolicy(run, { budget: new CallBudget(10), sleep: noSleep })).toBe("ok")
  })

  it("키 오류는 다시 부르지 않고 멈춘다", async () => {
    let attempts = 0
    const run = () => {
      attempts += 1
      return Promise.reject(new ApiGatewayError("kamis", "SERVICE_KEY_IS_NOT_REGISTERED_ERROR", "30"))
    }
    const error = await callWithPolicy(run, { budget: new CallBudget(10), sleep: noSleep }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(SourceStopped)
    expect((error as SourceStopped).reason).toBe("key_invalid")
    expect(attempts).toBe(1)
  })

  it("예산을 다 쓰면 더 부르지 않는다", async () => {
    const budget = new CallBudget(1)
    budget.count()
    const error = await callWithPolicy(() => Promise.resolve(1), { budget, sleep: noSleep }).catch((e: unknown) => e)
    expect((error as SourceStopped).reason).toBe("budget_exhausted")
  })
})

describe("출처별 호출 계획 (pipeline 5-1)", () => {
  it("KAMIS: 품목 140개를 D-3~D-1 기간으로 한 번씩, 소매만", async () => {
    const calls: FakeCall[] = []
    const result = await collectKamis(ctx(fakeKamis(() => [], calls)), "2026-10-27")
    expect(calls).toHaveLength(KAMIS_ITEMS.length)
    expect(KAMIS_ITEMS).toHaveLength(140)
    expect(calls[0]!.params.get("cond[exmn_ymd::GTE]")).toBe("20261024")
    expect(calls[0]!.params.get("cond[exmn_ymd::LTE]")).toBe("20261026")
    expect(new Set(calls.map((c) => c.params.get("cond[se_cd::EQ]")))).toEqual(new Set(["01"]))
    expect(result).toMatchObject({ failedCalls: 0, stop: null })
    expect(result.files).toHaveLength(1)
    expect(result.files[0]).toMatchObject({ label: "daily", targetFrom: "2026-10-24", targetTo: "2026-10-26", rows: [] })
    expect(result.files[0]!.requests).toHaveLength(140)
  })

  it("시간 한도가 지나면 새 호출을 하지 않고 받은 것까지 돌려준다 (time_limit)", async () => {
    const calls: FakeCall[] = []
    let clock = 0
    const fetch = fakeKamis(() => [], calls)
    const timed = async (url: string, init: { signal: AbortSignal }) => {
      clock += 60_000 // 호출마다 1분
      return fetch(url, init)
    }
    const result = await collectKamis({ ...ctx(timed), now: () => clock, deadline: 3 * 60_000 }, "2026-10-27")
    expect(calls).toHaveLength(3)
    expect(result.stop).toBe("time_limit")
    expect(result.files[0]!.requests).toHaveLength(3)
  })

  it("논리 호출 3개가 이어서 응답 없이 끝나면 닿지 않는 것으로 보고 멈춘다 (unreachable, 2026-10-28 러너 사례)", async () => {
    const calls: FakeCall[] = []
    const result = await collectKamis(ctx(fakeKamis(() => new Error("down"), calls)), "2026-10-27")
    expect(result.stop).toBe("unreachable")
    expect(result.failedCalls).toBe(3)
    expect(calls).toHaveLength(3 * 4) // 품목 3개 × (첫 호출 + 다시 부르기 3번)
  })

  it("응답 없는 호출 사이에 하나라도 받으면 다시 센다", async () => {
    const down = new Set(["111", "112", "114", "121"])
    const result = await collectKamis(ctx(fakeKamis((item) => (down.has(item) ? new Error("down") : []))), "2026-10-27")
    expect(result).toMatchObject({ stop: null, failedCalls: 4 })
  })

  it("KAMIS 주간 다시 받기: D-14~D-1, 라벨 recheck", async () => {
    const calls: FakeCall[] = []
    const result = await collectKamis(ctx(fakeKamis(() => [], calls)), "2026-10-27", 14)
    expect(calls[0]!.params.get("cond[exmn_ymd::GTE]")).toBe("20261013")
    expect(calls[0]!.params.get("cond[exmn_ymd::LTE]")).toBe("20261026")
    expect(result.files[0]).toMatchObject({ label: "recheck", targetFrom: "2026-10-13", targetTo: "2026-10-26" })
  })

  it("KAMIS: 한 품목이 계속 실패하면 세고 넘어가며, 받은 행과 호출 기록의 행 수가 맞는다", async () => {
    const rows = syntheticKamisRows({ year: "1997", itemCd: "211" })
    const fetch = fakeKamis((item) => (item === "212" ? new Error("down") : item === "211" ? rows : []))
    const result = await collectKamis(ctx(fetch), "2026-10-27")
    expect(result.failedCalls).toBe(1)
    const file = result.files[0]!
    expect(file.rows).toHaveLength(rows.length)
    expect(file.requests.reduce((sum, r) => sum + r.rowCount, 0)).toBe(rows.length)
    expect(file.requests.filter((r) => r.params["cond[item_cd::EQ]"] === "212")).toHaveLength(4) // 처음 + 다시 세 번
  })

  it("KAMIS: 키 오류면 첫 호출에서 멈춘다", async () => {
    const calls: FakeCall[] = []
    const result = await collectKamis(ctx(fakeKamis(() => new Response(KEY_ERROR_BODY, { status: 403 }), calls)), "2026-10-27")
    expect(result.stop).toBe("key_invalid")
    expect(calls).toHaveLength(1)
  })

  it("축평원: D-1·D-2·D-3 × 축종 7개 = 21회, itemCd 없이", async () => {
    const calls: URL[] = []
    const body = readSampleText("ekape/pork-all-items.xml")
    const fetch: FetchLike = async (url) => {
      calls.push(new URL(url))
      return new Response(body, { status: 200 })
    }
    const result = await collectEkape(ctx(fetch), "2026-10-27")
    expect(calls).toHaveLength(21)
    expect(new Set(calls.map((u) => u.searchParams.get("standYmd")))).toEqual(new Set(["20261026", "20261025", "20261024"]))
    expect(new Set(calls.map((u) => u.searchParams.get("judgeKind")))).toEqual(new Set(EKAPE_JUDGE_KINDS))
    expect(calls.every((u) => !u.searchParams.has("itemCd"))).toBe(true)
    expect(result.files[0]).toMatchObject({ targetFrom: "2026-10-24", targetTo: "2026-10-26" })
  })

  it("참가격: 점포 마스터 → 상품 마스터 → 식품 상품 457개 가격, 파일 셋", async () => {
    const paths: string[] = []
    const fetch: FetchLike = async (url) => {
      const u = new URL(url)
      paths.push(u.pathname.split("/").pop()!)
      if (u.pathname.endsWith("getStoreInfoSvc.do")) return new Response(readSampleText("chamgagyeok/store-100.xml"))
      if (u.pathname.endsWith("getProductInfoSvc.do")) return new Response(readSampleText("chamgagyeok/product-all.xml"))
      return new Response(readSampleText("chamgagyeok/price-non-survey-day.xml"))
    }
    const result = await collectChamga(ctx(fetch), ["2026-10-23"])
    expect(paths.slice(0, 2)).toEqual(["getStoreInfoSvc.do", "getProductInfoSvc.do"])
    expect(paths.filter((p) => p === "getProductPriceInfoSvc")).toHaveLength(457)
    expect(result.files.map((f) => f.label)).toEqual(["store-master", "product-master", "price"])
    expect(result.files[2]).toMatchObject({ targetFrom: "2026-10-23", targetTo: "2026-10-23" })
  })
})

describe("명령 인자", () => {
  it("기준일은 기본 오늘이고, 참가격은 조사일이 없으면 자동 모드다", () => {
    expect(parseRequest(["--source", "kamis"], "2026-10-27")).toEqual({ source: "kamis", day: "2026-10-27" })
    expect(parseRequest(["--source", "ekape", "--date", "2026-10-20"], "2026-10-27")).toEqual({ source: "ekape", day: "2026-10-20" })
    expect(parseRequest(["--source", "chamga"], "x")).toEqual({ source: "chamga" }) // 자동 모드
    expect(parseRequest(["--source", "chamga", "--survey-day", "2026-06-12", "--survey-day", "2026-06-26"], "x")).toEqual({
      source: "chamga",
      surveyDays: ["2026-06-12", "2026-06-26"],
    })
    expect(() => parseRequest(["--source", "chamga", "--survey-day", "0612"], "2026-10-27")).toThrow(/survey-day/)
    expect(() => parseRequest(["--source", "nope"], "2026-10-27")).toThrow(/사용법/)
    expect(() => parseRequest(["--source", "kamis", "--date", "20261027"], "2026-10-27")).toThrow(/YYYY-MM-DD/)
    expect(parseRequest(["--source", "kamis", "--recheck-days", "14"], "2026-10-27")).toEqual({ source: "kamis", day: "2026-10-27", recheckDays: 14 })
    expect(() => parseRequest(["--source", "ekape", "--recheck-days", "14"], "2026-10-27")).toThrow(/recheck-days/)
    expect(() => parseRequest(["--source", "kamis", "--recheck-days", "0"], "2026-10-27")).toThrow(/recheck-days/)
  })

  it("날짜 더하기", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
  })
})
