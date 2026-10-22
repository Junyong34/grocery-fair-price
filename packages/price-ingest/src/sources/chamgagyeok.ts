// 참가격 생필품 가격 (ProductPriceInfoService). 명세와 실측: grocery-price/docs/30-data/sources/chamgagyeok.md
import { z } from "zod"

import { assertServiceKey, assertYmd, runCall, type CallOptions } from "../http.ts"
import { codeIn, dig, interpret, listAt, parseBody } from "../response.ts"
import { parseOrThrow } from "../validate.ts"

const BASE_URL = "https://apis.data.go.kr/B551919/ProductPriceInfoService"
const SUCCESS_CODE = "00" // 정상 ok. 조사일이 아니어도 00이다 (빈 result)
const CLASS_CODES = ["AL", "UT", "AR", "BU"] as const

// 응답 result 안의 행 태그 이름. 점이 들어간 이름이 그대로 태그 이름이다.
const PRICE_KEY = "iros.openapi.service.vo.goodPriceVO"
const STORE_KEY = "iros.openapi.service.vo.entpInfoVO"
const STANDARD_KEY = "iros.openapi.service.vo.stdInfoVO"
const PRODUCT_KEY = "item" // 상품 정보만 item 태그다 (chamgagyeok.md 2-3)

// 명세 불일치: 가격 조회만 serviceKey, 나머지 세 기능은 ServiceKey를 쓴다 (chamgagyeok.md 1장)
export function chamgaPriceUrl(
  serviceKey: string,
  query: { goodInspectDay: string; entpId?: string; goodId?: string },
): string {
  assertServiceKey(serviceKey)
  assertYmd("goodInspectDay", query.goodInspectDay)
  if (!query.entpId && !query.goodId) throw new Error("entpId 또는 goodId 중 하나는 있어야 한다")
  const params: [string, string][] = [
    ["serviceKey", serviceKey],
    ["goodInspectDay", query.goodInspectDay],
  ]
  if (query.entpId) params.push(["entpId", query.entpId])
  if (query.goodId) params.push(["goodId", query.goodId])
  return `${BASE_URL}/getProductPriceInfoSvc?${new URLSearchParams(params).toString()}`
}

export function chamgaStoreUrl(serviceKey: string, query: { entpId?: string }): string {
  assertServiceKey(serviceKey)
  const params: [string, string][] = [["ServiceKey", serviceKey]]
  if (query.entpId) params.push(["entpId", query.entpId])
  return `${BASE_URL}/getStoreInfoSvc.do?${new URLSearchParams(params).toString()}`
}

export function chamgaProductUrl(serviceKey: string, query: { goodId?: string }): string {
  assertServiceKey(serviceKey)
  const params: [string, string][] = [["ServiceKey", serviceKey]]
  if (query.goodId) params.push(["goodId", query.goodId])
  return `${BASE_URL}/getProductInfoSvc.do?${new URLSearchParams(params).toString()}`
}

export function chamgaStandardUrl(serviceKey: string, query: { classCode: string }): string {
  assertServiceKey(serviceKey)
  if (!(CLASS_CODES as readonly string[]).includes(query.classCode)) {
    throw new Error("classCode는 AL·UT·AR·BU 중 하나여야 한다")
  }
  const params: [string, string][] = [
    ["ServiceKey", serviceKey],
    ["classCode", query.classCode],
  ]
  return `${BASE_URL}/getStandardInfoSvc.do?${new URLSearchParams(params).toString()}`
}

const digits = z.string().regex(/^\d+$/)
const yyyymmdd = z.string().regex(/^\d{8}$/)
const yn = z.enum(["Y", "N"])

const chamgaPriceRow = z.strictObject({
  goodInspectDay: yyyymmdd,
  entpId: digits,
  goodId: digits,
  goodPrice: digits,
  goodDcYn: yn.optional(),
  goodDcStartDay: yyyymmdd.optional(),
  goodDcEndDay: yyyymmdd.optional(),
  plusoneYn: yn.optional(),
  inputDttm: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
})

const chamgaStoreRow = z
  .strictObject({
    entpId: digits,
    entpName: z.string(),
    entpTypeCode: z.string(),
    entpAreaCode: z.string(),
    areaDetailCode: z.string(),
    xMapCoord: z.string().optional(), // 위도 (이름과 달리 x가 위도다)
    yMapCoord: z.string().optional(), // 경도
    plmkAddrBasic: z.string(),
    plmkAddrDetail: z.string().optional(),
    entpTelno: z.string().optional(),
    postNo: z.string().optional(),
    roadAddrBasic: z.string().optional(),
    roadAddrDetail: z.string().optional(),
  })
  .refine((row) => (row.xMapCoord === undefined) === (row.yMapCoord === undefined), {
    message: "좌표는 x·y가 함께 있거나 함께 없어야 한다",
  })

// detailMean (명세 Swagger의 datailMean이 아니다)
const chamgaProductRow = z.strictObject({
  goodId: digits,
  goodName: z.string(),
  productEntpCode: z.string(),
  goodUnitDivCode: z.string(),
  goodBaseCnt: digits,
  goodSmlclsCode: z.string(),
  detailMean: z.string().optional(),
  goodTotalCnt: digits,
  goodTotalDivCode: z.string(),
})

const chamgaStandardRow = z.strictObject({
  code: z.string(),
  codeName: z.string(),
  highCode: z.string().optional(),
})

// result는 행이 있으면 객체, 0건이면 빈 문자열이다. 빈 문자열은 빈 객체로 바꿔 검사한다 (union을 쓰지 않는다: ekape.ts 참고).
function envelope<Row extends z.ZodType>(key: string, row: Row) {
  return z.strictObject({
    response: z.strictObject({
      result: z.preprocess(
        (value) => (value === "" ? {} : value),
        z.strictObject({ [key]: z.array(row).optional() }),
      ),
      resultCode: z.string(),
      resultMsg: z.string(),
    }),
  })
}

export const chamgaPriceSchema = envelope(PRICE_KEY, chamgaPriceRow)
export const chamgaStoreSchema = envelope(STORE_KEY, chamgaStoreRow)
export const chamgaProductSchema = envelope(PRODUCT_KEY, chamgaProductRow)
export const chamgaStandardSchema = envelope(STANDARD_KEY, chamgaStandardRow)

export type ChamgaPriceRow = z.infer<typeof chamgaPriceRow>
export type ChamgaStoreRow = z.infer<typeof chamgaStoreRow>
export type ChamgaProductRow = z.infer<typeof chamgaProductRow>
export type ChamgaStandardRow = z.infer<typeof chamgaStandardRow>

// 상태·본문 판정. 참가격은 resultCode가 result 밖(형제)에 있다. 네 기능이 같은 규칙을 쓴다.
function readChamga(status: number, text: string): unknown {
  return interpret({
    source: "chamgagyeok",
    status,
    body: parseBody("xml", text),
    successCode: SUCCESS_CODE,
    codeOf: (body) => dig(body, ["response", "resultCode"]),
  })
}

export function readChamgaPrice(status: number, text: string): unknown {
  return readChamga(status, text)
}
export function readChamgaStore(status: number, text: string): unknown {
  return readChamga(status, text)
}
export function readChamgaProduct(status: number, text: string): unknown {
  return readChamga(status, text)
}
export function readChamgaStandard(status: number, text: string): unknown {
  return readChamga(status, text)
}

export function parseChamgaPrice(status: number, text: string): ChamgaPriceRow[] {
  const parsed = parseOrThrow("chamgagyeok", chamgaPriceSchema, readChamgaPrice(status, text))
  return parsed.response.result[PRICE_KEY] ?? []
}
export function parseChamgaStore(status: number, text: string): ChamgaStoreRow[] {
  const parsed = parseOrThrow("chamgagyeok", chamgaStoreSchema, readChamgaStore(status, text))
  return parsed.response.result[STORE_KEY] ?? []
}
export function parseChamgaProduct(status: number, text: string): ChamgaProductRow[] {
  const parsed = parseOrThrow("chamgagyeok", chamgaProductSchema, readChamgaProduct(status, text))
  return parsed.response.result[PRODUCT_KEY] ?? []
}
export function parseChamgaStandard(status: number, text: string): ChamgaStandardRow[] {
  const parsed = parseOrThrow("chamgagyeok", chamgaStandardSchema, readChamgaStandard(status, text))
  return parsed.response.result[STANDARD_KEY] ?? []
}

// 실측 비교용 raw 경로와 행 수
export const CHAMGA_ROW_PATH = {
  price: ["response", "result", PRICE_KEY],
  store: ["response", "result", STORE_KEY],
  product: ["response", "result", PRODUCT_KEY],
  standard: ["response", "result", STANDARD_KEY],
} as const

// raw_object.endpoint에 남기는 기능 이름 (주소 끝 그대로)
export const CHAMGA_ENDPOINT = {
  price: "getProductPriceInfoSvc",
  store: "getStoreInfoSvc.do",
  product: "getProductInfoSvc.do",
  standard: "getStandardInfoSvc.do",
} as const

function chamgaCall<T>(
  call: CallOptions,
  endpoint: string,
  url: string,
  read: (status: number, text: string) => T,
  rowCount: (value: T) => number,
): Promise<T> {
  return runCall({
    source: "chamgagyeok",
    endpoint,
    url,
    call,
    read,
    rowCount,
    resultCode: (text) => codeIn("xml", text, ["response", "resultCode"]),
  })
}

type PriceQuery = { goodInspectDay: string; entpId?: string; goodId?: string }

export function fetchChamgaPriceRaw(call: CallOptions, query: PriceQuery): Promise<unknown> {
  const url = chamgaPriceUrl(call.serviceKey, query)
  return chamgaCall(call, CHAMGA_ENDPOINT.price, url, readChamgaPrice, (raw) => listAt(raw, CHAMGA_ROW_PATH.price).length)
}

export function fetchChamgaPrice(call: CallOptions, query: PriceQuery): Promise<ChamgaPriceRow[]> {
  const url = chamgaPriceUrl(call.serviceKey, query)
  return chamgaCall(call, CHAMGA_ENDPOINT.price, url, parseChamgaPrice, (rows) => rows.length)
}

export function fetchChamgaStoreRaw(call: CallOptions, query: { entpId?: string }): Promise<unknown> {
  const url = chamgaStoreUrl(call.serviceKey, query)
  return chamgaCall(call, CHAMGA_ENDPOINT.store, url, readChamgaStore, (raw) => listAt(raw, CHAMGA_ROW_PATH.store).length)
}

export function fetchChamgaStore(call: CallOptions, query: { entpId?: string }): Promise<ChamgaStoreRow[]> {
  const url = chamgaStoreUrl(call.serviceKey, query)
  return chamgaCall(call, CHAMGA_ENDPOINT.store, url, parseChamgaStore, (rows) => rows.length)
}

export function fetchChamgaProductRaw(call: CallOptions, query: { goodId?: string }): Promise<unknown> {
  const url = chamgaProductUrl(call.serviceKey, query)
  return chamgaCall(call, CHAMGA_ENDPOINT.product, url, readChamgaProduct, (raw) => listAt(raw, CHAMGA_ROW_PATH.product).length)
}

export function fetchChamgaProduct(call: CallOptions, query: { goodId?: string }): Promise<ChamgaProductRow[]> {
  const url = chamgaProductUrl(call.serviceKey, query)
  return chamgaCall(call, CHAMGA_ENDPOINT.product, url, parseChamgaProduct, (rows) => rows.length)
}

export function fetchChamgaStandardRaw(call: CallOptions, query: { classCode: string }): Promise<unknown> {
  const url = chamgaStandardUrl(call.serviceKey, query)
  return chamgaCall(call, CHAMGA_ENDPOINT.standard, url, readChamgaStandard, (raw) => listAt(raw, CHAMGA_ROW_PATH.standard).length)
}

export function fetchChamgaStandard(call: CallOptions, query: { classCode: string }): Promise<ChamgaStandardRow[]> {
  const url = chamgaStandardUrl(call.serviceKey, query)
  return chamgaCall(call, CHAMGA_ENDPOINT.standard, url, parseChamgaStandard, (rows) => rows.length)
}
