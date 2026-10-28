// KAMIS 소매 백필의 작업 묶음 (ingest-foundation/04, judgment.md 1장).
// 묶음 하나 = 품목 하나 × 달력 해 하나. backfill_task.task_key는 'kamis:01-<품목>:<해>'다.
// 카탈로그에서 KAMIS가 대표인 품목만 받는다. 축산처럼 축평원이 대표인 품목은 시세에 세지 않으므로 받지 않는다.
// 한 품종이 두 품목 코드에서 오면 같은 묶음으로 받아야 하지만(pipeline 3-9 보관 1), 지금 카탈로그에는 그런 품종이 없다.
import { kamisPrimaryItemCodes } from "../catalog/match.ts"
import { addDays } from "../ingest/collect.ts"
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
