import { ApiTransportError, type Source } from "./errors.ts"

// fetch와 같은 모양. 테스트는 가짜 응답을, 실측은 호출 수를 세는 함수를 넣는다.
export type FetchLike = (url: string, init: { signal: AbortSignal }) => Promise<Response>

export type CallOptions = {
  serviceKey: string
  fetch?: FetchLike
  timeoutMs?: number
}

export function assertServiceKey(serviceKey: string): void {
  if (serviceKey.trim() === "") throw new Error("인증키(serviceKey)가 비어 있다")
}

// 요청 날짜 형식 검사 (명세가 빈 결과로 넘어가는 실패를 막는다, kamis.md 1장)
export function assertYmd(name: string, value: string): void {
  if (!/^\d{8}$/.test(value)) throw new Error(`${name}는 YYYYMMDD 8자리여야 한다`)
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
