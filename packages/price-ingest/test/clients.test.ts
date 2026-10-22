import { describe, expect, it } from "vitest"

import type { CallRecord, FetchLike } from "../src/http.ts"
import {
  ApiBusinessError,
  ApiContractError,
  ApiGatewayError,
  ApiHttpError,
  ApiTransportError,
} from "../src/errors.ts"
import { ekapeHasDayRows, fetchEkapeConsumerPrice, parseEkapeConsumerPrice } from "../src/sources/ekape.ts"
import { fetchChamgaPrice, fetchChamgaStandard } from "../src/sources/chamgagyeok.ts"
import { fetchKamisPerDay, fetchKamisPerDayAll } from "../src/sources/kamis.ts"
import { FAKE_KEY, readSampleText } from "./helpers.ts"

// 정해진 HTTP 상태와 본문만 돌려주는 가짜 fetch. 실제 네트워크를 쓰지 않는다.
function respond(status: number, body: string): FetchLike {
  return async () => new Response(body, { status })
}

function callWith(fetch: FetchLike) {
  return { serviceKey: FAKE_KEY, fetch }
}

// 실제 오류 메시지를 잡아서 돌려준다
async function errorOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error("오류가 나야 하는데 성공했다")
}

const KAMIS_QUERY = { fromYmd: "20260928", toYmd: "20260928", ctgryCd: "200", itemCd: "211", seCd: "01" } as const

describe("KAMIS 클라이언트", () => {
  it("샘플 응답을 행 배열로 돌려준다", async () => {
    const rows = await fetchKamisPerDay(
      callWith(respond(200, readSampleText("kamis/vegetable-baechu-retail.json"))),
      KAMIS_QUERY,
    )
    expect(rows).toHaveLength(5)
    expect(rows[0]?.item_nm).toBe("배추")
  })

  it("키가 등록되지 않으면 게이트웨이 오류(코드 30)로 끊고, 키를 오류 메시지에 남기지 않는다", async () => {
    const error = await errorOf(
      fetchKamisPerDay(callWith(respond(403, readSampleText("kamis/error-invalid-key.json"))), KAMIS_QUERY),
    )
    expect(error).toBeInstanceOf(ApiGatewayError)
    expect((error as ApiGatewayError).code).toBe("30")
    expect(String((error as Error).message)).not.toContain(FAKE_KEY)
  })

  it("HTTP 200이어도 resultCode가 0이 아니면 업무 오류다", async () => {
    const body = JSON.stringify({ response: { header: { resultCode: "99", resultMsg: "x" }, body: {} } })
    const error = await errorOf(fetchKamisPerDay(callWith(respond(200, body)), KAMIS_QUERY))
    expect(error).toBeInstanceOf(ApiBusinessError)
    expect((error as ApiBusinessError).code).toBe("99")
  })

  it("본문이 정해진 형식이 아니면 HTTP 오류로 끊는다", async () => {
    const error = await errorOf(fetchKamisPerDay(callWith(respond(500, "server error")), KAMIS_QUERY))
    expect(error).toBeInstanceOf(ApiHttpError)
    expect((error as ApiHttpError).status).toBe(500)
  })

  it("네트워크 오류 메시지에 주소와 키가 들어 있어도 밖으로 내보내지 않는다", async () => {
    const failing: FetchLike = async (url) => {
      throw new Error(`연결 실패: ${url}`)
    }
    const error = await errorOf(fetchKamisPerDay(callWith(failing), KAMIS_QUERY))
    expect(error).toBeInstanceOf(ApiTransportError)
    expect(String((error as Error).message)).not.toContain(FAKE_KEY)
  })
})

describe("축평원 클라이언트", () => {
  it("샘플 XML의 당일 행과 평년 행을 둘 다 준다", async () => {
    const rows = await fetchEkapeConsumerPrice(
      callWith(respond(200, readSampleText("ekape/pork-samgyeopsal.xml"))),
      { standYmd: "20261011", judgeKind: "4304" },
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]?.standYmd).toBe("20261011")
    expect(rows[1]?.standYmd).toBe("평년")
  })

  it("resultCode 99는 업무 오류로 끊고, Oracle 오류 문구를 메시지에 넣지 않는다", async () => {
    const error = await errorOf(
      fetchEkapeConsumerPrice(callWith(respond(200, readSampleText("ekape/error-bad-date.xml"))), {
        standYmd: "20261011",
        judgeKind: "4304",
      }),
    )
    expect(error).toBeInstanceOf(ApiBusinessError)
    expect((error as ApiBusinessError).code).toBe("99")
    expect(String((error as Error).message)).not.toContain("ORA-")
  })

  it("<items/>로 오는 0건은 빈 배열이다", async () => {
    const empty =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><response><header><resultCode>00</resultCode>' +
      "<resultMsg>NORMAL SERVICE.</resultMsg></header><body><items/></body></response>"
    const rows = await fetchEkapeConsumerPrice(callWith(respond(200, empty)), {
      standYmd: "20100115",
      judgeKind: "4304",
    })
    expect(rows).toEqual([])
  })
})

describe("참가격 클라이언트", () => {
  const PRICE_QUERY = { goodInspectDay: "20260925", goodId: "1000" } as const

  it("조사일이 아니면 00과 빈 결과가 온다. 빈 결과로 돌려준다", async () => {
    const rows = await fetchChamgaPrice(
      callWith(respond(200, readSampleText("chamgagyeok/price-non-survey-day.xml"))),
      PRICE_QUERY,
    )
    expect(rows).toEqual([])
  })

  it("classCode 오류(02)는 업무 오류다", async () => {
    const error = await errorOf(
      fetchChamgaPrice(callWith(respond(200, readSampleText("chamgagyeok/error-bad-classcode.xml"))), PRICE_QUERY),
    )
    expect(error).toBeInstanceOf(ApiBusinessError)
    expect((error as ApiBusinessError).code).toBe("02")
  })

  it("XML 게이트웨이 오류(HTTP 400, 코드 12)를 게이트웨이 오류로 읽는다", async () => {
    const gateway =
      "<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>NO_OPENAPI_SERVICE_ERROR</errMsg>" +
      "<returnAuthMsg>없는 서비스</returnAuthMsg><returnReasonCode>12</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>"
    const error = await errorOf(fetchChamgaStandard(callWith(respond(400, gateway)), { classCode: "AL" }))
    expect(error).toBeInstanceOf(ApiGatewayError)
    expect((error as ApiGatewayError).code).toBe("12")
  })

  it("기준정보 샘플을 코드 행으로 준다", async () => {
    const rows = await fetchChamgaStandard(callWith(respond(200, readSampleText("chamgagyeok/standard-AL.xml"))), {
      classCode: "AL",
    })
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]?.code).toMatch(/^\d+$/)
  })
})

describe("호출 기록 (raw_object.requests에 들어간다)", () => {
  function recording(fetch: FetchLike) {
    const records: CallRecord[] = []
    return { call: { serviceKey: FAKE_KEY, fetch, onCall: (record: CallRecord) => records.push(record) }, records }
  }

  it("성공한 호출: 엔드포인트, 인증키를 뺀 파라미터, HTTP 상태, resultCode, 행 수", async () => {
    const { call, records } = recording(respond(200, readSampleText("kamis/vegetable-baechu-retail.json")))
    await fetchKamisPerDay(call, KAMIS_QUERY)
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ endpoint: "perDay/price", httpStatus: 200, resultCode: "0", rowCount: 5 })
    expect(records[0]?.params).toMatchObject({ pageNo: "1", "cond[item_cd::EQ]": "211", returnType: "JSON" })
    expect(records[0]?.params).not.toHaveProperty("serviceKey")
  })

  it("게이트웨이 오류: 게이트웨이 코드를 남기고 행 수는 0이다", async () => {
    const { call, records } = recording(respond(403, readSampleText("kamis/error-invalid-key.json")))
    await errorOf(fetchKamisPerDay(call, KAMIS_QUERY))
    expect(records[0]).toMatchObject({ httpStatus: 403, resultCode: "gateway:30", rowCount: 0 })
  })

  it("응답을 받지 못한 호출도 남긴다 (HTTP 상태 0)", async () => {
    const { call, records } = recording(async () => {
      throw new Error("연결 실패")
    })
    await errorOf(fetchKamisPerDay(call, KAMIS_QUERY))
    expect(records[0]).toMatchObject({ httpStatus: 0, resultCode: null, rowCount: 0 })
  })

  it("참가격 ServiceKey도 빼고, 기능 이름은 주소 끝 그대로다", async () => {
    const { call, records } = recording(respond(200, readSampleText("chamgagyeok/standard-BU.xml")))
    await fetchChamgaStandard(call, { classCode: "BU" })
    expect(records[0]).toMatchObject({ endpoint: "getStandardInfoSvc.do", resultCode: "00", rowCount: 5 })
    expect(records[0]?.params).toEqual({ classCode: "BU" })
  })

  it("기록 어디에도 인증키가 없다", async () => {
    const { call, records } = recording(respond(200, readSampleText("chamgagyeok/price-by-good-1000.xml")))
    await fetchChamgaPrice(call, { goodInspectDay: "20260925", goodId: "1000" })
    expect(JSON.stringify(records)).not.toContain(FAKE_KEY)
  })
})

describe("KAMIS 모든 페이지 받기", () => {
  const template = (
    JSON.parse(readSampleText("kamis/vegetable-baechu-retail.json")) as {
      response: { body: { items: { item: Record<string, string>[] } } }
    }
  ).response.body.items.item[0]!

  function page(pageNo: number, rows: number, totalCount: number): string {
    const item = Array.from({ length: rows }, (_, index) => ({ ...template, mrkt_cd: String(1_000_000 + pageNo * 10_000 + index) }))
    return JSON.stringify({
      response: {
        header: { resultCode: "0", resultMsg: "정상" },
        body: { dataType: "JSON", items: { item }, numOfRows: 1000, pageNo, totalCount },
      },
    })
  }

  function paged(totalCount: number, rowsOf: (pageNo: number) => number): FetchLike {
    return async (url) => {
      const pageNo = Number(new URL(url).searchParams.get("pageNo"))
      return new Response(page(pageNo, rowsOf(pageNo), totalCount), { status: 200 })
    }
  }

  const query = { fromYmd: "20210101", toYmd: "20261012", ctgryCd: "200", itemCd: "211", seCd: "01" } as const

  it("totalCount 1500이면 두 페이지를 받아 1500행을 준다", async () => {
    const records: CallRecord[] = []
    const rows = await fetchKamisPerDayAll(
      { serviceKey: FAKE_KEY, fetch: paged(1500, (n) => (n === 1 ? 1000 : 500)), onCall: (r) => records.push(r) },
      query,
    )
    expect(rows).toHaveLength(1500)
    expect(records.map((r) => r.params.pageNo)).toEqual(["1", "2"])
  })

  it("0건이면 한 번만 부른다", async () => {
    const records: CallRecord[] = []
    const rows = await fetchKamisPerDayAll(
      { serviceKey: FAKE_KEY, fetch: paged(0, () => 0), onCall: (r) => records.push(r) },
      query,
    )
    expect(rows).toEqual([])
    expect(records).toHaveLength(1)
  })

  it("받은 행 수가 totalCount와 다르면 계약 오류다", async () => {
    const error = await errorOf(
      fetchKamisPerDayAll({ serviceKey: FAKE_KEY, fetch: paged(1500, (n) => (n === 1 ? 1000 : 400)) }, query),
    )
    expect(error).toBeInstanceOf(ApiContractError)
    expect(String((error as Error).message)).toContain("totalCount")
  })
})

describe("축평원 성공 판정: resultCode 00 그리고 당일 행 1개 이상 (pipeline 3-11)", () => {
  const rows = parseEkapeConsumerPrice(200, readSampleText("ekape/pork-samgyeopsal.xml"))

  it("당일 행이 있으면 성공이다", () => {
    expect(ekapeHasDayRows(rows)).toBe(true)
  })

  it("평년 행만 오면(아직 안 올라온 날) 성공이 아니다", () => {
    expect(ekapeHasDayRows(rows.filter((row) => row.standYmd === "평년"))).toBe(false)
  })

  it("0건이면 성공이 아니다", () => {
    expect(ekapeHasDayRows([])).toBe(false)
  })
})
