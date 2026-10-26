// 호출 정책: 실행마다 호출 예산, 실패하면 2s/4s/8s로 세 번 다시, 다시 불러도 소용없는 오류는 그 출처를 멈춘다
// (pipeline 5-2 "호출 실패"·"한도 초과"·"키 만료·미등록", kamis.md 10장).
import { ApiBusinessError, ApiContractError, ApiGatewayError, ApiHttpError, ApiTransportError } from "../errors.ts"
import type { DbSource } from "../load/types.ts"

// 실행마다 출처별 상한 (pipeline 5-2 한도 초과 행)
export const CALL_BUDGET: Record<DbSource, number> = { kamis: 8_000, ekape: 800, chamga: 1_500 }

export const RETRY_DELAYS_MS = [2_000, 4_000, 8_000] as const

// 실행마다 호출에 쓸 시간. 워크플로 timeout-minutes(KAMIS 30, 축평원 15, 참가격 60)보다 짧게 두어 업로드·적재할 시간을 남긴다.
// 넘기면 그때까지 받은 것을 올리고 부분(time_limit)으로 끝낸다. 시간 초과로 취소되면 받은 것을 다 잃는다 (ingest-schedule/11, 2026-10-26)
export const CALL_TIME_LIMIT_MS: Record<DbSource, number> = { kamis: 20 * 60_000, ekape: 8 * 60_000, chamga: 45 * 60_000 }

// 그 출처의 이번 실행을 멈추는 이유. ingest_run.error_code에 그대로 남는다 (13이 알림을 고른다).
export type StopReason = "key_invalid" | "quota_exceeded" | "budget_exhausted" | "service_missing" | "time_limit"

export class SourceStopped extends Error {
  reason: StopReason
  constructor(reason: StopReason) {
    super(`수집을 멈춘다: ${reason}`)
    this.name = "SourceStopped"
    this.reason = reason
  }
}

// data.go.kr 게이트웨이 returnReasonCode
const KEY_CODES = new Set(["20", "30", "31", "32"]) // 접근 거부, 키 미등록, 활용기간 만료, 등록되지 않은 IP
const QUOTA_CODE = "22" // 일일 호출 한도 초과
const MISSING_SERVICE_CODE = "12" // 없는 서비스 주소
const RETRY_GATEWAY_CODES = new Set(["01", "99", "UNKNOWN"]) // 게이트웨이 내부 오류

export type Verdict = { kind: "stop"; reason: StopReason } | { kind: "retry" } | { kind: "fail" }

// 오류를 보고 다시 부를지, 이 호출만 실패로 둘지, 출처를 멈출지 정한다.
export function classify(error: unknown): Verdict {
  if (error instanceof SourceStopped) return { kind: "stop", reason: error.reason }
  if (error instanceof ApiGatewayError) {
    if (KEY_CODES.has(error.code)) return { kind: "stop", reason: "key_invalid" }
    if (error.code === QUOTA_CODE) return { kind: "stop", reason: "quota_exceeded" }
    if (error.code === MISSING_SERVICE_CODE) return { kind: "stop", reason: "service_missing" }
    return RETRY_GATEWAY_CODES.has(error.code) ? { kind: "retry" } : { kind: "fail" }
  }
  if (error instanceof ApiHttpError) {
    if (error.status === 401 || error.status === 403) return { kind: "stop", reason: "key_invalid" }
    return error.status === 429 || error.status >= 500 ? { kind: "retry" } : { kind: "fail" }
  }
  if (error instanceof ApiTransportError) return { kind: "retry" }
  // 응답이 계약과 다르거나 업무 오류: 다시 불러도 같다. 이 호출만 실패
  if (error instanceof ApiContractError || error instanceof ApiBusinessError) return { kind: "fail" }
  throw error // 예상하지 못한 오류(코드 버그)는 실행을 끊는다
}

export class CallBudget {
  readonly limit: number
  used = 0
  constructor(limit: number) {
    this.limit = limit
  }
  // 호출 기록마다 센다 (페이지·재시도 포함)
  count(): void {
    this.used += 1
  }
  // 논리 호출(페이지 묶음 하나) 전에 본다. 페이지가 여럿이면 몇 번 넘칠 수 있다
  check(): void {
    if (this.used >= this.limit) throw new SourceStopped("budget_exhausted")
  }
}

export type Sleep = (ms: number) => Promise<void>

export const realSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 호출 하나를 정책대로 부른다. 다시 불러도 안 되면 마지막 오류를 던진다. 출처를 멈출 오류는 SourceStopped로 던진다.
export async function callWithPolicy<T>(
  run: () => Promise<T>,
  options: { budget: CallBudget; sleep: Sleep; delays?: readonly number[] },
): Promise<T> {
  const delays = options.delays ?? RETRY_DELAYS_MS
  for (let attempt = 0; ; attempt += 1) {
    options.budget.check()
    try {
      return await run()
    } catch (error) {
      const verdict = classify(error)
      if (verdict.kind === "stop") throw new SourceStopped(verdict.reason)
      if (verdict.kind === "fail" || attempt >= delays.length) throw error
      await options.sleep(delays[attempt]!)
    }
  }
}
