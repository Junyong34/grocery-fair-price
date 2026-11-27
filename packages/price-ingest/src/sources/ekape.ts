// 축평원 일자별 축산물소비자가격 (consumerPriceDaily). 명세와 실측: grocery-price/docs/30-data/sources/ekape.md
import { z } from "zod"

import { assertServiceKey, assertYmd, runCall, type CallOptions } from "../http.ts"
import { codeIn, dig, interpret, listAt, parseBody } from "../response.ts"
import { parseOrThrow } from "../validate.ts"

// 주소는 http다. https가 아니다 (ekape.md 0장).
const BASE_URL = "http://data.ekape.or.kr/openapi-data/service/user/grade/consumerPriceDaily"
export const EKAPE_ENDPOINT = "consumerPriceDaily"
const SUCCESS_CODE = "00"

export const EKAPE_ROW_PATH = ["response", "body", "items", "item"] as const

export type EkapeQuery = {
  standYmd: string
  judgeKind: string
  itemCd?: string
}

export function ekapeConsumerPriceUrl(serviceKey: string, query: EkapeQuery): string {
  assertServiceKey(serviceKey)
  assertYmd("standYmd", query.standYmd)
  const params: [string, string][] = [
    ["serviceKey", serviceKey],
    ["standYmd", query.standYmd],
    ["judgeKind", query.judgeKind],
  ]
  if (query.itemCd !== undefined) params.push(["itemCd", query.itemCd])
  const url = new URL(BASE_URL)
  url.search = new URLSearchParams(params).toString()
  return url.toString()
}

const digits = z.string().regex(/^\d+$/)

// 지역 가격 17개(regionPrc1~17)는 값이 없으면 태그가 빠진다 (ekape.md 3장). MVP 미사용이지만 형태는 고정한다.
const regionPrices = Object.fromEntries(
  Array.from({ length: 17 }, (_, index) => [`regionPrc${index + 1}`, digits.optional()]),
)

const PRICE_FIELDS = ["maxPrc", "minPrc", "ntslPrc"] as const

// 가격 세 필드는 당일 행에는 꼭 있다. 평년 행만 세 필드가 함께 빠질 수 있다:
// 2023-01-01·02의 소 갈비 1+등급, 수입 소 갈비·양지·갈비살 평년 행 (ekape.md 6장, ingest-foundation/04).
// 일부만 빠지거나 당일 행에서 빠지면 형식이 바뀐 것으로 보고 계약 오류로 둔다.
export const ekapeRowSchema = z
  .strictObject({
    grdNm: z.string(),
    itemCd: z.string().regex(/^\d{2}$/),
    itemNm: z.string(),
    judgeKind: z.string().regex(/^\d{4}$/),
    judgeKindNm: z.string(),
    maxPrc: digits.optional(),
    minPrc: digits.optional(),
    ntslPrc: digits.optional(),
    standYmd: z.union([z.string().regex(/^\d{8}$/), z.literal("평년")]),
    unit: z.string(),
    ...regionPrices,
  })
  .superRefine(
    (row, ctx) => {
      const missing = PRICE_FIELDS.filter((field) => row[field] === undefined)
      if (missing.length === 0) return
      if (row.standYmd === "평년" && missing.length === PRICE_FIELDS.length) return
      for (const field of missing) {
        ctx.addIssue({ code: "custom", path: [field], message: "가격 필드가 없다 (평년 행만 세 필드가 함께 빠질 수 있다)" })
      }
    },
    // 다른 필드 오류(예: ntslPrc → ntslPrice 이름 바뀜)가 있어도 돌려, 빠진 가격 필드 이름을 함께 보여 준다
    { when: (payload) => typeof payload.value === "object" && payload.value !== null },
  )

// 0건은 <items/>로 와서 빈 문자열이 된다. 빈 태그는 빈 목록으로 바꾼 뒤 검사한다.
// (union으로 두면 실패 때 안쪽 필드 이름이 가려져서, 바뀐 필드를 보여줄 수 없다.)
export const ekapeConsumerPriceSchema = z.strictObject({
  response: z.strictObject({
    header: z.strictObject({ resultCode: z.string(), resultMsg: z.string() }),
    body: z.strictObject({
      items: z.preprocess(
        (value) => (value === "" ? { item: [] } : value),
        z.strictObject({ item: z.array(ekapeRowSchema) }),
      ),
    }),
  }),
})

export type EkapeRow = z.infer<typeof ekapeRowSchema>

export function readEkapeConsumerPrice(status: number, text: string): unknown {
  return interpret({
    source: "ekape",
    status,
    body: parseBody("xml", text),
    successCode: SUCCESS_CODE,
    codeOf: (body) => dig(body, ["response", "header", "resultCode"]),
  })
}

export function parseEkapeConsumerPrice(status: number, text: string): EkapeRow[] {
  const parsed = parseOrThrow("ekape", ekapeConsumerPriceSchema, readEkapeConsumerPrice(status, text))
  return parsed.response.body.items.item
}

function ekapeCall<T>(
  call: CallOptions,
  query: EkapeQuery,
  read: (status: number, text: string) => T,
  rowCount: (value: T) => number,
): Promise<T> {
  return runCall({
    source: "ekape",
    endpoint: EKAPE_ENDPOINT,
    url: ekapeConsumerPriceUrl(call.serviceKey, query),
    call,
    read,
    rowCount,
    resultCode: (text) => codeIn("xml", text, ["response", "header", "resultCode"]),
  })
}

export function fetchEkapeConsumerPriceRaw(call: CallOptions, query: EkapeQuery): Promise<unknown> {
  return ekapeCall(call, query, readEkapeConsumerPrice, (raw) => listAt(raw, EKAPE_ROW_PATH).length)
}

export function fetchEkapeConsumerPrice(call: CallOptions, query: EkapeQuery): Promise<EkapeRow[]> {
  return ekapeCall(call, query, parseEkapeConsumerPrice, (rows) => rows.length)
}

// 성공은 resultCode 00 그리고 당일 행 1개 이상이다 (pipeline 3-11). 아직 안 올라온 날은 평년 행만 오고,
// 자료가 없는 날은 0건이다 (ekape.md 6장). false이면 원본은 남기고 그날을 다음 실행에서 다시 받는다.
export function ekapeHasDayRows(rows: readonly EkapeRow[]): boolean {
  return rows.some((row) => row.standYmd !== "평년")
}
