// 담은 품종(P4)의 순수 계산: 판정별 묶음, 개수, 담은 뒤 판정이 바뀐 품종.

import { VERDICT_GROUPS } from "./copy"
import type { VarietySummary, VerdictKind } from "./types"

/** 기기에 저장된 담은 품종 하나: id와 담을 때의 판정 · 그 판정의 조사일. */
export type BasketEntry = { id: string; verdict: VerdictKind; on: string }

export type BasketItem = { variety: VarietySummary; addedVerdict: VerdictKind; addedOn: string }

export type BasketView = {
  count: number
  /** 싸요 → 보통 → 비싸요 → 판정 전. 빈 묶음은 뺀다. 묶음 안은 % 오름차순 */
  groups: { kind: VerdictKind; title: string; items: BasketItem[] }[]
  /** 판정별 개수. 판정 전은 0이면 뺀다 */
  tally: { kind: VerdictKind; count: number }[]
  /** 담을 때와 지금 판정이 다른 품종(담은 순서) */
  changed: BasketItem[]
}

export function basketView(varieties: readonly VarietySummary[], entries: readonly BasketEntry[]): BasketView {
  const byId = new Map(varieties.map((variety) => [variety.id, variety]))
  const items = entries.flatMap((entry): BasketItem[] => {
    const variety = byId.get(entry.id)
    return variety ? [{ variety, addedVerdict: entry.verdict, addedOn: entry.on }] : []
  })
  const ofKind = (kind: VerdictKind) => items.filter((item) => item.variety.verdict.kind === kind)
  return {
    count: items.length,
    groups: VERDICT_GROUPS.map(({ kind, title }) => ({
      kind,
      title,
      items: ofKind(kind).sort((a, b) => (a.variety.verdict.pct ?? 0) - (b.variety.verdict.pct ?? 0)),
    })).filter((group) => group.items.length),
    tally: VERDICT_GROUPS.map(({ kind }) => ({ kind, count: ofKind(kind).length })).filter(
      (entry) => entry.kind !== "none" || entry.count > 0
    ),
    changed: items.filter((item) => item.addedVerdict !== item.variety.verdict.kind),
  }
}
