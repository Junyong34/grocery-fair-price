import { ApiTransportError, type Source } from "./errors.ts"

// fetch와 같은 모양. 테스트는 가짜 응답을, 실측은 호출 수를 세는 함수를 넣는다.
export type FetchLike = (url: string, init: { signal: AbortSignal }) => Promise<Response>

// 호출 한 번의 기록. 원본 파일 헤더와 raw_object.requests에 들어간다. 인증키는 넣지 않는다.
export type CallRecord = {
  endpoint: string
  params: Record<string, string> // serviceKey·ServiceKey를 뺀 요청 파라미터 (pageNo 포함)
  httpStatus: number // 0: 응답을 받지 못함 (연결 실패·시간 초과)
  resultCode: string | null // 게이트웨이 오류면 gateway:<코드>
  rowCount: number
}

export type CallOptions = {
  serviceKey: string
  fetch?: FetchLike
  timeoutMs?: number
  onCall?: (record: CallRecord) => void
}

export function assertServiceKey(serviceKey: string): void {
  if (serviceKey.trim() === "") throw new Error("인증키(serviceKey)가 비어 있다")
}

// 요청 날짜 형식 검사 (명세가 빈 결과로 넘어가는 실패를 막는다, kamis.md 1장)
export function assertYmd(name: string, value: string): void {
  if (!/^\d{8}$/.test(value)) throw new Error(`${name}는 YYYYMMDD 8자리여야 한다`)
}

const KEY_PARAMS = new Set(["serviceKey", "ServiceKey"])

// 요청 주소의 파라미터에서 인증키를 뺀다
export function redactedParams(url: string): Record<string, string> {
  const params: Record<string, string> = {}
  for (const [name, value] of new URL(url).searchParams) {
    if (!KEY_PARAMS.has(name)) params[name] = value
  }
  return params
}

// 주소를 부르고 HTTP 상태와 본문 글자를 돌려준다. 실패는 주소·키 없는 전송 오류로 바꾼다.
export async function getText(
  source: Source,
  url: string,
  call: CallOptions,
): Promise<{ status: number; text: string }> {
  const send: FetchLike = call.fetch ?? fetch
  try {
    const response = await send(url, { signal: AbortSignal.timeout(call.timeoutMs ?? 30_000) })
    return { status: response.status, text: await response.text() }
  } catch {
    throw new ApiTransportError(source)
  }
}

// 부르고, 읽고, 호출 기록을 남긴다. 실패한 호출도 기록한다 (행 수 0).
export async function runCall<T>(options: {
  source: Source
  endpoint: string
  url: string
  call: CallOptions
  read: (status: number, text: string) => T
  rowCount: (value: T) => number
  resultCode: (text: string) => string | null
}): Promise<T> {
  const record = (httpStatus: number, resultCode: string | null, rowCount: number) =>
    options.call.onCall?.({
      endpoint: options.endpoint,
      params: redactedParams(options.url),
      httpStatus,
      resultCode,
      rowCount,
    })

  let response: { status: number; text: string }
  try {
    response = await getText(options.source, options.url, options.call)
  } catch (error) {
    record(0, null, 0)
    throw error
  }
  try {
    const value = options.read(response.status, response.text)
    record(response.status, options.resultCode(response.text), options.rowCount(value))
    return value
  } catch (error) {
    record(response.status, options.resultCode(response.text), 0)
    throw error
  }
}
