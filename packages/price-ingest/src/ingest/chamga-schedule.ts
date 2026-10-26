// 참가격 조사일 감지·완료 규칙 (chamgagyeok.md 5-4, pipeline 5-1, ingest-schedule/10).
// 조사일은 격주 금요일 날짜로 등록되지만 입력이 조사일 2일 전~7일 뒤로 퍼지고, 한 조사일도 며칠에 나뉘어 들어온다.
// 그래서 매일 확정되지 않은 최근 금요일 2개를 본다:
//   - 아직 가격이 없으면 감지 상품 3개로 들어왔는지 본다. 금요일 뒤 10일이 지나도 없으면 빈 조사일로 닫는다.
//   - 들어오기 시작했으면 매일 전체를 다시 받는다. 행 수가 두 번 연속 같고 마지막 등록(inputDttm)이 하루 넘게 지나면 완료다.
//   - 완료되면 그다음 월요일에 한 번 더 받고 닫는다.
// 상태는 source_day 한 줄에 있다 (새 열 없음): status, row_count(그날 관측값 수), stable_checks(행 수가 연속으로 같았던 횟수),
// max_source_registered_at(가장 늦은 inputDttm), closed_at(더 받지 않기로 한 시각).
import type { StopReason } from "./calls.ts"
import { addDays, detectChamgaSurvey, type CollectContext } from "./collect.ts"

export type SurveyDayState = {
  status: string
  closedAt: string | null
  stableChecks: number
  rowCount: number
  maxRegisteredAt: string | null
}

export type SurveyDayAction = "skip" | "detect" | "fetch" | "final"

const DAY_MS = 86_400_000
// 빈 조사일로 닫기까지 기다리는 날 수 (금요일 뒤)
export const EMPTY_CLOSE_DAYS = 10

function weekday(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay() // 0 일요일 … 5 금요일
}

// 오늘(KST)을 포함해 그 전의 금요일 n개, 새 것부터
export function recentFridays(today: string, n = 2): string[] {
  const latest = addDays(today, -((weekday(today) - 5 + 7) % 7))
  return Array.from({ length: n }, (_, index) => addDays(latest, -7 * index))
}

export function isComplete(state: SurveyDayState, now: string): boolean {
  if (state.stableChecks < 1 || state.maxRegisteredAt === null) return false
  return Date.parse(now) - Date.parse(state.maxRegisteredAt) > DAY_MS
}

// 전체를 받은 뒤의 stable_checks: 그날 행 수가 받기 전과 같으면 하나 올리고, 바뀌었으면 0
export function nextStableChecks(before: SurveyDayState | undefined, rowCountAfter: number): number {
  if (before === undefined || before.rowCount !== rowCountAfter) return 0
  return before.stableChecks + 1
}

export function emptyCloseDue(friday: string, today: string): boolean {
  return today >= addDays(friday, EMPTY_CLOSE_DAYS)
}

// 아직 가격이 들어오지 않은 상태 (감지가 필요하다)
const NOT_STARTED = new Set(["pending", "failed", "empty_unexpected"])

export function surveyDayAction(state: SurveyDayState | undefined, today: string, now: string): SurveyDayAction {
  if (state?.closedAt) return "skip"
  if (state === undefined || (NOT_STARTED.has(state.status) && state.rowCount === 0)) return "detect"
  if (isComplete(state, now)) return weekday(today) === 1 ? "final" : "skip"
  return "fetch"
}

export type PlannedFetch = { day: string; final: boolean; before: SurveyDayState | undefined }

export type ChamgaPlan = {
  fetch: PlannedFetch[] // 전체를 받을 조사일
  notYet: string[] // 감지했는데 아직 없음
  closeEmpty: string[] // 빈 조사일로 닫을 날
  failedCalls: number
  stop: StopReason | null
}

// 최근 금요일 2개마다 할 일을 정한다. 감지가 필요한 날은 여기서 감지 상품을 부른다 (조사일당 최대 3회).
// states: source_day에서 읽은 상태. DB가 안 되면 빈 표를 넘긴다 (둘 다 감지하고, 닫지 않는다).
export async function planChamga(
  ctx: CollectContext,
  states: ReadonlyMap<string, SurveyDayState>,
  input: { today: string; now: string; canClose: boolean },
): Promise<ChamgaPlan> {
  const plan: ChamgaPlan = { fetch: [], notYet: [], closeEmpty: [], failedCalls: 0, stop: null }
  for (const day of recentFridays(input.today)) {
    const state = states.get(day)
    const action = surveyDayAction(state, input.today, input.now)
    if (action === "skip") continue
    if (action === "fetch" || action === "final") {
      plan.fetch.push({ day, final: action === "final", before: state })
      continue
    }
    const detection = await detectChamgaSurvey(ctx, day)
    plan.failedCalls += detection.failedCalls
    if (detection.stop) {
      plan.stop = detection.stop
      break
    }
    if (detection.found) plan.fetch.push({ day, final: false, before: state })
    else if (input.canClose && emptyCloseDue(day, input.today)) plan.closeEmpty.push(day)
    else plan.notYet.push(day)
  }
  return plan
}
