// 수집 테스트용 가짜 공공 API. 주소의 파라미터를 보고 응답을 고른다. 네트워크를 쓰지 않는다.
import type { FetchLike } from "../../src/http.ts"
import { parseKamisPerDay, type KamisRow } from "../../src/sources/kamis.ts"
import { readSampleText } from "../helpers.ts"

export const KEY_ERROR_BODY = readSampleText("kamis/error-invalid-key.json")

export function kamisBody(rows: readonly KamisRow[]): string {
  return JSON.stringify({
    response: {
      header: { resultCode: "0", resultMsg: "정상" },
      body: { dataType: "JSON", items: { item: rows }, numOfRows: 1000, pageNo: 1, totalCount: rows.length },
    },
  })
}

// 배추 14일 샘플을 다른 해·없는 품목·없는 시장 코드로 옮긴 행 (다른 테스트·샘플 데이터와 겹치지 않게)
export function syntheticKamisRows(options: { year: string; itemCd: string; priceDelta?: number }): KamisRow[] {
  return parseKamisPerDay(200, readSampleText("kamis/vegetable-baechu-retail-14d.json")).map((row) => ({
    ...row,
    exmn_ymd: options.year + row.exmn_ymd.slice(4),
    orgnl_reg_dt: row.orgnl_reg_dt && options.year + row.orgnl_reg_dt.slice(4),
    item_cd: options.itemCd,
    mrkt_cd: row.mrkt_cd && `9${row.mrkt_cd.slice(1)}`,
    exmn_dd_prc: String(Number(row.exmn_dd_prc) + (options.priceDelta ?? 0)),
  }))
}

export type FakeCall = { endpoint: string; params: URLSearchParams }

// KAMIS 품목 코드 → 응답. 함수는 호출마다 부른다 (던지면 연결 실패, Response면 그대로).
export type KamisHandler = (itemCd: string) => Response | Error | KamisRow[]

export function fakeKamis(handler: KamisHandler, calls: FakeCall[] = []): FetchLike {
  return async (url) => {
    const parsed = new URL(url)
    calls.push({ endpoint: parsed.pathname, params: parsed.searchParams })
    const result = handler(parsed.searchParams.get("cond[item_cd::EQ]") ?? "")
    if (result instanceof Error) throw result
    if (result instanceof Response) return result
    return new Response(kamisBody(result), { status: 200 })
  }
}
