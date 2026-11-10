import { canBeChoseong, getChoseong } from "es-hangul"

import { findFood } from "../data/foods"
import { termsOf, type PairingRow, type PairingSign } from "../data/infant-pairings"

/** 궁합표 검색에만 쓰는 다른 이름. 제철 품종의 별칭(foods)도 함께 본다. */
const PAIRING_SEARCH_ALIASES: Readonly<Partial<Record<string, readonly string[]>>> = {
  egg: ["달걀"],
  "white-fish-fillet": ["대구", "가자미"],
}

/** 기준 재료가 아닌 재료가 어느 기준 재료 표의 O·X에 적혀 있는지 */
export type PairingMentionMatch = {
  item: string
  in: readonly { row: PairingRow; sign: PairingSign }[]
}

export type PairingSearchResult = {
  /** 이름·별칭·초성이 맞는 기준 재료. 이름이 검색어로 시작하는 것이 앞에 온다. */
  bases: readonly PairingRow[]
  /** 기준 재료 표는 없지만 O·X 목록에 있는 재료(예: 땅콩) */
  mentions: readonly PairingMentionMatch[]
}

const compact = (text: string) => text.replace(/\s+/g, "")
const isChoseongQuery = (query: string) => [...query].every((char) => canBeChoseong(char))

/**
 * 이유식 궁합표 검색. 빈 검색어면 기준 재료를 모두 돌려준다.
 * 띄어쓰기는 무시하고, 검색어가 초성으로만 되어 있으면 초성끼리 비교한다(match-foods와 같은 규칙).
 */
export function matchPairings(rows: readonly PairingRow[], query: string): PairingSearchResult {
  const q = compact(query)
  if (!q) return { bases: rows, mentions: [] }
  const choseong = isChoseongQuery(q)
  const toKey = choseong ? (text: string) => compact(getChoseong(text)) : compact
  const hits = (text: string) => toKey(text).includes(q)
  // 언급은 표 밖의 낯선 재료라, 초성 검색에서는 앞부분이 맞는 것만 낸다("ㄴㄹㅈ"이 "달걀노른자"를 끌어오지 않게).
  const mentionHits = (text: string) => (choseong ? toKey(text).startsWith(q) : hits(text))

  const startsWith: PairingRow[] = []
  const includes: PairingRow[] = []
  for (const row of rows) {
    const names = termsOf(row.name)
    const aliases = [...(PAIRING_SEARCH_ALIASES[row.id] ?? []), ...(findFood(row.id)?.aliases ?? [])]
    if (names.some((name) => toKey(name).startsWith(q))) startsWith.push(row)
    else if (names.some(hits) || aliases.some(hits)) includes.push(row)
  }
  const bases = [...startsWith, ...includes]

  // 기준 재료로 이미 찾힌 이름과 모든 기준 재료 이름은 언급에서 뺀다(그 재료 표로 가면 된다).
  const baseTerms = new Set(rows.flatMap((row) => termsOf(row.name)))
  const byItem = new Map<string, { row: PairingRow; sign: PairingSign }[]>()
  for (const row of rows) {
    for (const [sign, items] of [
      ["O", row.good],
      ["X", row.bad],
    ] as const) {
      for (const item of items) {
        if (baseTerms.has(item) || !mentionHits(item)) continue
        const list = byItem.get(item) ?? []
        list.push({ row, sign })
        byItem.set(item, list)
      }
    }
  }
  const mentions = [...byItem]
    .map(([item, list]) => ({ item, in: list }))
    .sort((a, b) => Number(!toKey(a.item).startsWith(q)) - Number(!toKey(b.item).startsWith(q)) || a.item.localeCompare(b.item, "ko"))

  return { bases, mentions }
}
