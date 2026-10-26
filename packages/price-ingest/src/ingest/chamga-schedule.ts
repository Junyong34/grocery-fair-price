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

export type PlannedFetch = {
  day: string
  final: boolean // 이번 받기 뒤 닫는다 (완료 뒤 월요일, 지난 조사일 채우기)
  before: SurveyDayState | undefined
}

export type ChamgaPlan = {
  fetch: PlannedFetch[] // 전체를 받을 조사일
  notYet: string[] // 감지했는데 아직 없음
  closeEmpty: string[] // 빈 조사일로 닫을 날
  failedCalls: number
  stop: StopReason | null
}

// 참가격 API가 주는 첫 조사일 (chamgagyeok.md 0장). 지난 조사일 채우기는 여기부터
export const CHAMGA_FIRST_SURVEY_DAY = "2026-06-12"

// 조사일 하나를 전체로 받는 데 드는 호출: 식품 가격 457회 (마스터 2회는 실행마다 한 번)
export const CALLS_PER_SURVEY_DAY = 457
const MASTER_CALLS = 2
const DETECT_CALLS = 3

// 지난 조사일 채우기 대상: 첫 조사일부터 최근 금요일 2개 전까지의 금요일, 오래된 것부터
export function backlogFridays(today: string, firstSurveyDay = CHAMGA_FIRST_SURVEY_DAY): string[] {
  const recent = recentFridays(today)
  const oldestRecent = recent[recent.length - 1]!
  const days: string[] = []
  for (let day = firstSurveyDay; day < oldestRecent; day = addDays(day, 7)) days.push(day)
  return days
}

// 최근 금요일 2개마다 할 일을 정하고, 남는 예산으로 지난 조사일을 오래된 것부터 채운다 (12).
// 감지가 필요한 날은 여기서 감지 상품을 부른다 (조사일당 최대 3회).
// states: source_day에서 읽은 상태. DB가 안 되면 빈 표와 canClose = false를 넘긴다 (최근 2개만 감지, 닫지 않음, 채우기 없음).
export async function planChamga(
  ctx: CollectContext,
  states: ReadonlyMap<string, SurveyDayState>,
  input: { today: string; now: string; canClose: boolean; firstSurveyDay?: string },
): Promise<ChamgaPlan> {
  const plan: ChamgaPlan = { fetch: [], notYet: [], closeEmpty: [], failedCalls: 0, stop: null }

  // 감지해서 찾으면 받기 목록에, 못 찾으면 닫거나 아직 안 옴으로. 멈춤 오류면 false
  const detect = async (day: string, state: SurveyDayState | undefined, final: boolean): Promise<boolean> => {
    const detection = await detectChamgaSurvey(ctx, day)
    plan.failedCalls += detection.failedCalls
    if (detection.stop) {
      plan.stop = detection.stop
      return false
    }
    if (detection.found) plan.fetch.push({ day, final, before: state })
    else if (input.canClose && emptyCloseDue(day, input.today)) plan.closeEmpty.push(day)
    else plan.notYet.push(day)
    return true
  }

  for (const day of recentFridays(input.today)) {
    const state = states.get(day)
    const action = surveyDayAction(state, input.today, input.now)
    if (action === "skip") continue
    if (action === "fetch" || action === "final") plan.fetch.push({ day, final: action === "final", before: state })
    else if (!(await detect(day, state, false))) return plan
  }

  if (!input.canClose) return plan
  // 남는 예산: 이미 쓴 호출, 마스터, 받기로 한 조사일의 가격을 빼고 본다
  const left = () => ctx.budget.limit - ctx.budget.used - MASTER_CALLS - CALLS_PER_SURVEY_DAY * plan.fetch.length
  for (const day of backlogFridays(input.today, input.firstSurveyDay)) {
    const state = states.get(day)
    if (state?.closedAt) continue
    if (left() < DETECT_CALLS + CALLS_PER_SURVEY_DAY) break
    // 지난 조사일은 다 들어와 있다. 받으면 바로 닫는다
    if (!(await detect(day, state, true))) return plan
  }
  return plan
}
