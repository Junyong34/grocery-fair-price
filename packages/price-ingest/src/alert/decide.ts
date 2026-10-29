// 수집 실행 한 번의 결과로 알릴지 정한다 (ingest-schedule/13, pipeline 5-3).
//   즉시: 인증키 오류, 원본 저장 실패(받은 것을 잃는다, Supabase 일시정지면 540), 예상하지 못한 실패(코드 오류는 저절로 낫지 않는다)
//   2회 연속: 일부 실패(다음 실행이 메운다), DB 접속 실패(일시적 DNS·접속 실패가 있어 두 번째에 확정한다, 04 Answer)
// 종료 코드는 ingest/run.ts EXIT. 잡이 시간 초과·취소로 끝나 종료 코드가 없으면 unexpected로 2회 연속 규칙을 쓴다.
import { EXIT } from "../ingest/run.ts"
import type { Cause } from "./issues.ts"

export type RunResult = { exitCode: number | null } // null: 종료 코드를 남기지 못하고 끝났다 (시간 초과·취소)

export type AlertDecision = { alert: false; reason: string } | { alert: true; cause: Cause; immediate: boolean }

const IMMEDIATE: Partial<Record<number, Cause>> = {
  [EXIT.keyInvalid]: "key_invalid",
  [EXIT.storageFailed]: "storage_failed",
  [EXIT.unexpected]: "unexpected",
}

const ON_REPEAT: Partial<Record<number, Cause>> = {
  [EXIT.partial]: "partial",
  [EXIT.dbUnreachable]: "db_unreachable",
}

// previousFailed: 같은 워크플로의 직전 실행(이번 실행 제외)이 실패로 끝났나
export function decideAlert(run: RunResult, previousFailed: boolean): AlertDecision {
  if (run.exitCode === EXIT.ok) return { alert: false, reason: "성공" }
  if (run.exitCode !== null) {
    const now = IMMEDIATE[run.exitCode]
    if (now) return { alert: true, cause: now, immediate: true }
  }
  const cause = run.exitCode === null ? "unexpected" : (ON_REPEAT[run.exitCode] ?? "unexpected")
  if (!previousFailed) return { alert: false, reason: `첫 실패 (${cause}). 다음 실행도 실패하면 알린다` }
  return { alert: true, cause, immediate: false }
}

export function summaryOf(run: RunResult, decision: Extract<AlertDecision, { alert: true }>): string {
  const code = run.exitCode === null ? "종료 코드 없음 (시간 초과·취소)" : `종료 코드 ${run.exitCode}`
  return decision.immediate ? `${code}` : `${code}, 직전 실행도 실패`
}
