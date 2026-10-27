import { canBeChoseong, getChoseong } from "es-hangul"

import type { SearchIndex, SearchVariety } from "./types"

/**
 * 검색 결과.
 * - hits: 이름 · 초성 · 품목 · 별칭 일부가 맞은 품종
 * - item: 검색어가 품목(또는 품목을 가리키는 별칭)이라 품종을 고르게 한다("어떤 호박인가요?")
 * - alias: 검색어가 품종 하나를 가리키는 별칭이다("대패삼겹" → 삼겹살)
 * - typo: 맞는 품종은 없지만 한 글자만 다른 품종이 있다("배츄" → 배추)
 * - category: 검색어가 카테고리 이름이다(결과 없음 화면의 카테고리 알약)
 */
export type SearchResult =
  | { kind: "empty" }
  | { kind: "hits"; ids: readonly string[] }
  | { kind: "item"; item: string; ids: readonly string[] }
  | { kind: "alias"; alias: string; ids: readonly string[] }
  | { kind: "typo"; ids: readonly string[] }
  | { kind: "category"; category: string; ids: readonly string[] }
  | { kind: "none" }

const compact = (text: string) => text.replace(/\s+/g, "")

const isChoseongQuery = (query: string) => [...query].every((char) => canBeChoseong(char))

/**
 * 검색어로 품종을 찾는다. 순서: 별칭이 통째로 맞음 → 품목 이름 → 카테고리 이름 → 이름 · 초성 · 품목 · 별칭 일부 → 한 글자 오타.
 * 띄어쓰기는 무시한다. 검색어가 초성으로만 되어 있으면(예: "ㅂㅊ") 초성끼리 견준다.
 * 이름 검색 결과는 검색어가 이름 앞쪽에 있을수록, 이름이 짧을수록 앞에 둔다(배추 → 양배추 → 알배기배추).
 */
export function searchVarieties(index: SearchIndex, query: string): SearchResult {
  const q = compact(query)
  if (!q) return { kind: "empty" }

  const alias = index.aliases.find((a) => compact(a.text) === q)
  if (alias && "varietyId" in alias) {
    return { kind: "alias", alias: alias.text, ids: [alias.varietyId] }
  }
  const item = alias && "item" in alias ? alias.item : q
  const itemVarieties = index.varieties.filter((v) => compact(v.item) === compact(item))
  const namedLikeItem = index.varieties.some((v) => compact(v.name) === compact(item))
  if (itemVarieties.length > 1 && !namedLikeItem) {
    return { kind: "item", item: itemVarieties[0]!.item, ids: itemVarieties.map((v) => v.id) }
  }

  const category = index.categories.find((name) => compact(name) === q)
  if (category) {
    return { kind: "category", category, ids: index.varieties.filter((v) => v.category === category).map((v) => v.id) }
  }

  const hits = findHits(index, q)
  if (hits.length) return { kind: "hits", ids: hits }

  if (!isChoseongQuery(q) && q.length > 1) {
    // 한 글자 이름("배", "무")은 어떤 두 글자와도 한 글자 차이라 제안하지 않는다.
    const near = index.varieties.filter((v) => compact(v.name).length > 1 && editDistance(q, compact(v.name)) === 1)
    if (near.length) return { kind: "typo", ids: near.map((v) => v.id) }
  }
  return { kind: "none" }
}

function findHits(index: SearchIndex, q: string): string[] {
  const toKey = isChoseongQuery(q) ? (text: string) => compact(getChoseong(text)) : compact
  const aliasesOf = new Map<string, string[]>()
  for (const a of index.aliases) {
    if ("varietyId" in a) aliasesOf.set(a.varietyId, [...(aliasesOf.get(a.varietyId) ?? []), a.text])
  }
  // 이름에서 맞은 자리. 이름이 아니라 품목 · 별칭에서 맞으면 이름에서 맞은 품종 뒤에 둔다.
  const rank = (v: SearchVariety): number => {
    const at = toKey(v.name).indexOf(q)
    if (at >= 0) return at
    const others = [v.item, ...(aliasesOf.get(v.id) ?? [])]
    return others.some((text) => toKey(text).includes(q)) ? Number.MAX_SAFE_INTEGER : -1
  }
  return index.varieties
    .map((v, order) => ({ v, order, at: rank(v) }))
    .filter(({ at }) => at >= 0)
    .sort((a, b) => a.at - b.at || a.v.name.length - b.v.name.length || a.order - b.order)
    .map(({ v }) => v.id)
}

/**
 * 이름에서 검색어가 맞은 자리 [시작, 끝). 검색 결과에서 이름을 강조하는 데 쓴다.
 * 띄어쓰기는 건너뛰고, 초성 검색어면 글자마다 초성으로 견준다. 이름에서 맞지 않았으면(품목 · 별칭으로 찾음) null.
 */
export function matchRange(name: string, query: string): [number, number] | null {
  const q = compact(query)
  if (!q) return null
  const choseong = isChoseongQuery(q)
  const chars = [...name].flatMap((char, at) =>
    /\s/.test(char) ? [] : [{ at, key: choseong ? getChoseong(char) || char : char }]
  )
  const pos = chars.map((c) => c.key).join("").indexOf(q)
  if (pos < 0) return null
  return [chars[pos]!.at, chars[pos + q.length - 1]!.at + 1]
}

/** 글자 단위 편집 거리(레벤슈타인). */
function editDistance(a: string, b: string): number {
  const x = [...a]
  const y = [...b]
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j)
  for (let i = 1; i <= x.length; i++) {
    const row = [i]
    for (let j = 1; j <= y.length; j++) {
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (x[i - 1] === y[j - 1] ? 0 : 1))
    }
    prev = row
  }
  return prev[y.length]!
}
