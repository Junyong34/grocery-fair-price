// 빈 날 메우기와 source_day 상태 규칙 (ingest-schedule/08, pipeline 3-5·5-1·5-2). KAMIS·축평원.
// Actions 정기 실행은 늦거나 빠진다. 그래서 시각에 기대지 않고, 매일 실행이 기준일 D의 D-14~D-4 중
// 끝나지 않은 날(기록 없음·아직 안 옴·실패·일부만 옴)을 D-3~D-1과 함께 다시 받는다.
//
// 상태는 그 출처의 그날 관측값이 하나라도 있는지로만 정한다. 휴일 달력은 쓰지 않는다 (08 Answer):
// KAMIS는 축산 행이 주말·공휴일에도 오고 축평원도 2026년엔 매일 값이 있어, 출처 전체가 0건인 날은 휴일이 아니라 늦거나 빠진 것이다.
//   행 있음 → ok (아직 안 옴·실패·와야 하는데 빔이었어도)
//   행 없음, 호출이 깨끗함 → pending, 확인 횟수 + 1. 3번 확인했고 3일이 지났으면 empty_unexpected
//   행 없음, 호출·적재가 깨끗하지 않음 → failed (확인 횟수는 세지 않는다)
//   empty_expected·partial은 다른 판정이 정한 상태라 그대로 둔다
import { addDays } from "./collect.ts"

export type SourceDayStatus = "pending" | "ok" | "partial" | "empty_expected" | "empty_unexpected" | "failed"

export type DayState = { status: SourceDayStatus; attempts: number; rowCount: number }

// 다시 받는 기간 (기준일 D의 D-14~D-1). 주간 14일 다시 받기와 같은 길이다
export const FILL_GAP_DAYS = 14
// 행이 없는 날을 이만큼 확인하고 이만큼의 날이 지나면 와야 하는데 빔으로 닫는다 (5-2 "3일 동안 다시 시도")
export const EMPTY_RETRY_CHECKS = 3
export const EMPTY_RETRY_DAYS = 3
// 축평원은 하루 단위 호출이라 날마다 7회가 든다. 하루 한도 1,000에서 정기 21 + 백필 900을 빼면 79가 남아 2일(14회)까지만 더한다
export const EKAPE_GAP_DAYS_PER_RUN = 2

// 다시 받지 않는 상태: 받았거나(ok), 판정이 끝났다(empty_expected 휴일·빈 조사일, empty_unexpected 닫힌 빈 날)
const SETTLED: ReadonlySet<SourceDayStatus> = new Set(["ok", "empty_expected", "empty_unexpected"])

// 기준일 D의 D-14~D-(daily+1) 중 다시 받을 날 (오래된 날부터). daily: 매일 받는 날 수 (KAMIS·축평원 3)
export function gapDays(
  day: string,
  states: ReadonlyMap<string, DayState>,
  options: { daily?: number; max?: number } = {},
): string[] {
  const daily = options.daily ?? 3
  const out: string[] = []
  for (let offset = FILL_GAP_DAYS; offset > daily; offset -= 1) {
    const target = addDays(day, -offset)
    const state = states.get(target)
    if (state === undefined || !SETTLED.has(state.status)) out.push(target)
  }
  return options.max === undefined ? out : out.slice(0, options.max)
}

// 이번 실행이 확인한 날: D-daily~D-1과 다시 받은 날 (날짜순)
export function windowDays(day: string, daily: number, extra: readonly string[]): string[] {
  const days = new Set(extra)
  for (let offset = daily; offset >= 1; offset -= 1) days.add(addDays(day, -offset))
  return [...days].sort()
}

// 한 번 확인한 뒤의 상태. rowCount: 적재 뒤 그날 이 출처의 관측값 행 수. clean: 호출 실패·멈춤·적재 실패가 없었다
export function nextDayState(input: {
  day: string
  today: string // KST 오늘
  rowCount: number
  clean: boolean
  current: DayState | null
}): { status: SourceDayStatus; attempts: number } {
  const status = input.current?.status ?? null
  const attempts = input.current?.attempts ?? 0
  if (status === "empty_expected" || status === "partial") return { status, attempts: input.clean ? attempts + 1 : attempts }
  // ok인 날은 행 수와 관계없이 ok다 (한 번 받은 날을 뒤의 빈 응답이 되돌리지 않는다)
  if (input.rowCount > 0 || status === "ok") return { status: "ok", attempts: input.clean ? attempts + 1 : attempts }
  if (!input.clean) return { status: status === "empty_unexpected" ? status : "failed", attempts }
  const checks = attempts + 1
  if (status === "empty_unexpected") return { status, attempts: checks }
  const closed = checks >= EMPTY_RETRY_CHECKS && input.today >= addDays(input.day, EMPTY_RETRY_DAYS)
  return { status: closed ? "empty_unexpected" : "pending", attempts: checks }
}
