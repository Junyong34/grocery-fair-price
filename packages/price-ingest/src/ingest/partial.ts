// KAMIS 일부만 옴 (pipeline 5-2 "일부만 옴", ingest-foundation/05). 순수 함수. DB는 load/source-day.ts.
// 품목(item_cd)별 그날 관측값 건수를 최근 4주 같은 요일의 정상 건수 평균과 비교해 기준의 비율(calc_param kamis.partial.item_ratio,
// 0.5) 미만이면 partial, 0건이면 missing으로 source_day_part에 남기고, 그런 품목이 있으면 그날 source_day를 partial로 둔다.
// 소매(축산 제외)가 모두 0건인 날은 휴일·주말이라 판정하지 않는다 (kamis.md 7장 "휴일 판정은 그날 소매 품목 전체가 0건인지로").
// 다시 받기는 빈 날 메우기(fill-gaps.ts)가 partial인 날을 함께 받는다. KAMIS는 품목마다 기간 호출이라 품목만 골라 받아도 호출 수가 같다.
import { addDays } from "./collect.ts"

export const SAME_WEEKDAY_WEEKS = 4

export type ItemCount = { item: string; livestock: boolean; rows: number }
export type PartStatus = "ok" | "partial" | "missing"
export type ItemPart = { item: string; rows: number; baseline: number | null; status: PartStatus }
export type PartHistory = { day: string; item: string; rows: number; status: PartStatus }

// 품목마다 7·14·21·28일 전 ok였던 날의 건수 평균. 빠진 날(missing·partial)은 기준을 끌어내리지 않게 뺀다
export function baselineOf(history: readonly PartHistory[], day: string): Map<string, number> {
  const weeks = new Set(Array.from({ length: SAME_WEEKDAY_WEEKS }, (_, i) => addDays(day, -7 * (i + 1))))
  const sums = new Map<string, { total: number; days: number }>()
  for (const h of history) {
    if (!weeks.has(h.day) || h.status !== "ok") continue
    const s = sums.get(h.item) ?? { total: 0, days: 0 }
    sums.set(h.item, { total: s.total + h.rows, days: s.days + 1 })
  }
  return new Map([...sums].map(([item, s]) => [item, s.total / s.days]))
}

export function judgeItems(
  counts: readonly ItemCount[],
  baselines: ReadonlyMap<string, number>,
  ratio: number,
): { holiday: boolean; partial: boolean; parts: ItemPart[] } {
  const rowsOf = new Map(counts.map((c) => [c.item, c.rows]))
  const holiday = !counts.some((c) => !c.livestock && c.rows > 0)
  if (holiday) {
    const parts = counts
      .filter((c) => c.rows > 0)
      .map((c) => ({ item: c.item, rows: c.rows, baseline: baselines.get(c.item) ?? null, status: "ok" as const }))
      .sort((a, b) => a.item.localeCompare(b.item))
    return { holiday, partial: false, parts }
  }
  const items = [...new Set([...rowsOf.keys(), ...baselines.keys()])].sort((a, b) => a.localeCompare(b))
  const parts: ItemPart[] = []
  for (const item of items) {
    const rows = rowsOf.get(item) ?? 0
    const baseline = baselines.get(item) ?? null
    if (baseline === null || baseline === 0) {
      if (rows > 0) parts.push({ item, rows, baseline, status: "ok" })
      continue
    }
    const status: PartStatus = rows === 0 ? "missing" : rows < ratio * baseline ? "partial" : "ok"
    parts.push({ item, rows, baseline, status })
  }
  return { holiday, partial: parts.some((p) => p.status !== "ok"), parts }
}
