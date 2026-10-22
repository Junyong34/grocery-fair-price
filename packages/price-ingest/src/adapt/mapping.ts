// 원천 키 → 품종·규격·기준 단위. 실제 매핑은 DB의 source_code_map과 p3-variety-catalog/01 결과가 만든다.
// 어댑터는 매핑을 함수로 받는다. 매핑이 없으면 품종 없음으로 남기고 건수를 보고한다.
import type { Source } from "../errors.ts"
import type { Draft } from "./draft.ts"
import type { BaseUnit } from "./units.ts"

export type VarietyLink = { varietyKey: string; specKey: string; base: BaseUnit }

// date: 관측 날짜(YYYY-MM-DD). 평년 행은 요청한 기준일이다. 날짜별 매핑(valid_from·valid_to)을 위해 받는다.
export type Mapping = (source: Source, sourceKey: string, date: string) => VarietyLink | undefined

export type AdaptContext = { mapping: Mapping }

export type UnmappedEntry = { source: Source; sourceKey: string; count: number }

// 품종이 없는 초안을 원천 키별로 센다 (많은 순, 같으면 키 순). 운영자가 매핑할 목록이다.
export function unmappedReport(drafts: readonly Draft[]): UnmappedEntry[] {
  const entries = new Map<string, UnmappedEntry>()
  for (const draft of drafts) {
    if (draft.varietyKey !== null) continue
    const id = `${draft.source}|${draft.sourceKey}`
    const entry = entries.get(id) ?? { source: draft.source, sourceKey: draft.sourceKey, count: 0 }
    entry.count += 1
    entries.set(id, entry)
  }
  return [...entries.values()].sort((a, b) => b.count - a.count || a.sourceKey.localeCompare(b.sourceKey))
}
