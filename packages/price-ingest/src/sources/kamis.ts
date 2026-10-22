// KAMIS 일별 도·소매 가격 (perDay/price). 명세와 실측: grocery-price/docs/30-data/sources/kamis.md
import { z } from "zod"

import { assertServiceKey, assertYmd, getText, type CallOptions } from "../http.ts"
import { dig, interpret, parseBody } from "../response.ts"
import { parseOrThrow } from "../validate.ts"

const BASE_URL = "https://apis.data.go.kr/B552845/perDay/price"
const SUCCESS_CODE = "0" // 축평원·참가격의 "00"과 다르다 (kamis.md 0장)

// 본문에서 행 배열이 있는 경로 (contract 실측에서 행을 세는 데 쓴다)
export const KAMIS_ROW_PATH = ["response", "body", "items", "item"] as const

export type KamisPerDayQuery = {
  fromYmd: string
  toYmd: string
  ctgryCd: string
  itemCd: string
  seCd: "01" | "02"
  pageNo?: number
}

// 요청 주소. 필수 조건을 빼면 KAMIS는 오류 없이 0건을 주므로 여기서 막는다 (kamis.md 1장).
export function kamisPerDayUrl(serviceKey: string, query: KamisPerDayQuery): string {
  assertServiceKey(serviceKey)
  assertYmd("fromYmd", query.fromYmd)
  assertYmd("toYmd", query.toYmd)
  if (query.seCd !== "01" && query.seCd !== "02") throw new Error("seCd는 01 또는 02여야 한다")
  const url = new URL(BASE_URL)
  url.search = new URLSearchParams([
    ["serviceKey", serviceKey],
    ["returnType", "JSON"],
    ["pageNo", String(query.pageNo ?? 1)],
    ["numOfRows", "1000"],
    ["cond[exmn_ymd::GTE]", query.fromYmd],
    ["cond[exmn_ymd::LTE]", query.toYmd],
    ["cond[ctgry_cd::EQ]", query.ctgryCd],
    ["cond[item_cd::EQ]", query.itemCd],
    ["cond[se_cd::EQ]", query.seCd],
  ]).toString()
  return url.toString()
}

const digits = z.string().regex(/^\d+$/)
const yyyymmdd = z.string().regex(/^\d{8}$/)

// 행 필드 20개. 빈 값은 없고, 축산(부류 500)만 mrkt_*·orgnl_reg_dt가 null이다 (kamis.md 2-2).
const kamisRow = z.strictObject({
  exmn_ymd: yyyymmdd,
  se_cd: z.string().regex(/^\d{2}$/),
  se_nm: z.string(),
  ctgry_cd: z.string().regex(/^\d{3}$/),
  ctgry_nm: z.string(),
  item_cd: z.string().regex(/^\d{3,4}$/),
  item_nm: z.string(),
  vrty_cd: z.string().regex(/^\d{2}$/),
  vrty_nm: z.string(),
  grd_cd: z.string().regex(/^\d{1,2}$/),
  grd_nm: z.string(),
  sgg_cd: z.string().regex(/^\d{4}$/),
  sgg_nm: z.string(),
  mrkt_cd: z.string().regex(/^\d{7}$/).nullable(),
  mrkt_nm: z.string().nullable(),
  unit: z.string(),
  unit_sz: digits,
  exmn_dd_prc: digits,
  exmn_dd_cnvs_prc: digits,
  orgnl_reg_dt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    .nullable(),
})

export const kamisPerDaySchema = z.strictObject({
  response: z.strictObject({
    header: z.strictObject({ resultCode: z.string(), resultMsg: z.string() }),
    body: z.strictObject({
      dataType: z.literal("JSON"),
      items: z.strictObject({ item: z.array(kamisRow) }),
      numOfRows: z.number(),
      pageNo: z.number(),
      totalCount: z.number(),
    }),
  }),
})

export type KamisRow = z.infer<typeof kamisRow>

// 상태·본문을 판정해 raw 본문을 돌려준다. 계약 검사는 하지 않는다 (실측 비교가 이 값을 쓴다).
export function readKamisPerDay(status: number, text: string): unknown {
  return interpret({
    source: "kamis",
    status,
    body: parseBody("json", text),
    successCode: SUCCESS_CODE,
    codeOf: (body) => dig(body, ["response", "header", "resultCode"]),
  })
}

export function parseKamisPerDay(status: number, text: string): KamisRow[] {
  const body = parseOrThrow("kamis", kamisPerDaySchema, readKamisPerDay(status, text))
  return body.response.body.items.item
}

export async function fetchKamisPerDayRaw(call: CallOptions, query: KamisPerDayQuery): Promise<unknown> {
  const { status, text } = await getText("kamis", kamisPerDayUrl(call.serviceKey, query), call)
  return readKamisPerDay(status, text)
}

export async function fetchKamisPerDay(call: CallOptions, query: KamisPerDayQuery): Promise<KamisRow[]> {
  const { status, text } = await getText("kamis", kamisPerDayUrl(call.serviceKey, query), call)
  return parseKamisPerDay(status, text)
}
