import { XMLParser } from "fast-xml-parser"

import { ApiBusinessError, ApiContractError, ApiGatewayError, ApiHttpError, type Source } from "./errors.ts"

export type BodyFormat = "json" | "xml"

// 값은 모두 문자열로 둔다 (명세: 응답 값은 숫자도 문자열). <?xml?> 선언은 버린다.
// 원소가 하나여도 배열이 되도록 item과 *VO 태그를 배열로 읽는다.
const xmlParser = new XMLParser({
  parseTagValue: false,
  parseAttributeValue: false,
  ignoreDeclaration: true,
  isArray: (name) => name === "item" || name.endsWith("VO"),
})

// 읽지 못하면 undefined. 상태 코드를 먼저 보고 판단하려고 여기서는 던지지 않는다.
export function parseBody(format: BodyFormat, text: string): unknown {
  try {
    return format === "json" ? JSON.parse(text) : xmlParser.parse(text)
  } catch {
    return undefined
  }
}

// 경로를 따라 값을 찾는다. 중간에 없으면 undefined.
export function dig(value: unknown, path: readonly string[]): unknown {
  let current: unknown = value
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current)) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

// 경로의 행 배열. 없거나 빈 태그(문자열 "")이면 빈 배열.
export function listAt(value: unknown, path: readonly string[]): Record<string, unknown>[] {
  const found = dig(value, path)
  return Array.isArray(found) ? (found as Record<string, unknown>[]) : []
}

// 호출 기록에 남길 결과 코드. 본문의 resultCode, 없으면 게이트웨이 오류 코드(gateway:<코드>), 그것도 없으면 null.
export function codeIn(format: BodyFormat, text: string, path: readonly string[]): string | null {
  const body = parseBody(format, text)
  const code = dig(body, path)
  if (typeof code === "string") return code
  const reason = dig(body, ["OpenAPI_ServiceResponse", "cmmMsgHeader", "returnReasonCode"])
  return reason === undefined ? null : `gateway:${String(reason)}`
}

// 게이트웨이 오류 → HTTP 상태 → resultCode 순서로 판정한다.
// 성공이면 본문을 그대로 돌려준다 (스키마 검사는 호출한 쪽이 한다).
export function interpret(options: {
  source: Source
  status: number
  body: unknown
  successCode: string
  codeOf: (body: unknown) => unknown
}): unknown {
  const header = dig(options.body, ["OpenAPI_ServiceResponse", "cmmMsgHeader"])
  if (header !== undefined) {
    const errMsg = dig(header, ["errMsg"])
    const reason = dig(header, ["returnReasonCode"])
    throw new ApiGatewayError(options.source, String(errMsg ?? "UNKNOWN"), String(reason ?? "UNKNOWN"), options.status)
  }
  if (options.status !== 200) throw new ApiHttpError(options.source, options.status)
  if (options.body === undefined) throw new ApiContractError(options.source, ["응답 본문을 해석할 수 없다"])
  const code = options.codeOf(options.body)
  if (typeof code !== "string") throw new ApiContractError(options.source, ["응답에 resultCode가 없다"])
  if (code !== options.successCode) throw new ApiBusinessError(options.source, code)
  return options.body
}
