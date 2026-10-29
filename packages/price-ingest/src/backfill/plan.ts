// 백필의 작업 묶음 (ingest-foundation/04, judgment.md 1장).
// KAMIS: 묶음 하나 = 품목 하나 × 달력 해 하나. backfill_task.task_key는 'kamis:01-<품목>:<해>'다.
//   카탈로그에서 KAMIS가 대표인 품목만 받는다. 축산처럼 축평원이 대표인 품목은 시세에 세지 않으므로 받지 않는다.
//   한 품종이 두 품목 코드에서 오면 같은 묶음으로 받아야 하지만(pipeline 3-9 보관 1), 지금 카탈로그에는 그런 품종이 없다.
// 축평원: 묶음 하나 = 축종 하나 × 달 하나. task_key는 'ekape:<축종>:<YYYY-MM>'다.
//   하루 단위로만 조회되어(ekape.md 10장) 묶음 하나가 그 달의 날 수만큼 부른다. 축종 7개 모두 카탈로그에 대표 규격이 있다.
import { kamisPrimaryItemCodes } from "../catalog/match.ts"
import { addDays, EKAPE_JUDGE_KINDS } from "../ingest/collect.ts"
import { KAMIS_ITEMS, type KamisItem } from "../ingest/kamis-items.ts"

// 계절비율에 쓰는 이력 (2026-10-27 결정: 5년이 아니라 3년)
export const BACKFILL_YEARS = 3

export type BackfillTask = { taskKey: string; item: KamisItem; year: number }

export function backfillItems(): KamisItem[] {
  const primary = kamisPrimaryItemCodes()
  return KAMIS_ITEMS.filter((item) => primary.has(item.itemCd))
}

// 묶음이 받는 조사일 범위. 올해 묶음은 어제(today − 1)까지다. 받을 날이 없으면 null
export function taskRange(year: number, today: string): { from: string; to: string } | null {
  const from = `${year}-01-01`
  const yesterday = addDays(today, -1)
  const to = `${year}-12-31` < yesterday ? `${year}-12-31` : yesterday
  return from <= to ? { from, to } : null
}

export function taskKeyOf(item: KamisItem, year: number): string {
  return `kamis:01-${item.itemCd}:${year}`
}

// 최근 해부터 늘어놓는다. 예산이 모자라 중간에 멈춰도 최근 해(관측값 90일, 수준의 26주)부터 채워진다.
// 첫 해는 today의 해 − years의 1월 1일이라 이력이 3년보다 조금 길다 (연중앙값이 그 날짜를 끝으로 하는 365일을 본다)
export function backfillTasks(today: string, options: { years?: number; items?: readonly string[] } = {}): BackfillTask[] {
  const years = options.years ?? BACKFILL_YEARS
  let items = backfillItems()
  if (options.items) {
    const unknown = options.items.filter((code) => !items.some((item) => item.itemCd === code))
    if (unknown.length > 0) throw new Error(`백필 대상이 아닌 품목 코드: ${unknown.join(", ")}`)
    items = items.filter((item) => options.items!.includes(item.itemCd))
  }
  const thisYear = Number(today.slice(0, 4))
  const tasks: BackfillTask[] = []
  for (let year = thisYear; year >= thisYear - years; year -= 1) {
    if (taskRange(year, today) === null) continue
    for (const item of items) tasks.push({ taskKey: taskKeyOf(item, year), item, year })
  }
  return tasks
}

export type EkapeBackfillTask = { taskKey: string; judgeKind: string; month: string; from: string; to: string }

// 축평원 묶음을 최근 달부터 늘어놓는다. 한 달의 축종 7개가 붙어 있어, 하루 예산(약 900회)에서 멈춰도 최근 몇 달은 모든 축종이 찬다.
// 기간은 KAMIS와 같다: today의 해 − years의 1월 1일부터 어제까지
export function ekapeBackfillTasks(today: string, options: { years?: number; kinds?: readonly string[] } = {}): EkapeBackfillTask[] {
  const years = options.years ?? BACKFILL_YEARS
  let kinds: readonly string[] = EKAPE_JUDGE_KINDS
  if (options.kinds) {
    const unknown = options.kinds.filter((code) => !kinds.includes(code))
    if (unknown.length > 0) throw new Error(`축평원 축종 코드가 아니다: ${unknown.join(", ")}`)
    kinds = kinds.filter((code) => options.kinds!.includes(code))
  }
  const first = `${Number(today.slice(0, 4)) - years}-01-01`
  const yesterday = addDays(today, -1)
  const tasks: EkapeBackfillTask[] = []
  for (let month = yesterday.slice(0, 7); `${month}-01` >= first; month = previousMonth(month)) {
    const from = `${month}-01`
    const last = addDays(`${nextMonth(month)}-01`, -1)
    const to = last < yesterday ? last : yesterday
    for (const judgeKind of kinds) tasks.push({ taskKey: `ekape:${judgeKind}:${month}`, judgeKind, month, from, to })
  }
  return tasks
}

// YYYY-MM의 앞뒤 달
function previousMonth(month: string): string {
  return addDays(`${month}-01`, -1).slice(0, 7)
}

function nextMonth(month: string): string {
  return addDays(`${month}-28`, 4).slice(0, 7)
}
