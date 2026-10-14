import { canBeChoseong, getChoseong } from "es-hangul"

import type { Food } from "../data/foods"

const compact = (text: string) => text.replace(/\s+/g, "")
const isChoseongQuery = (query: string) => [...query].every((char) => canBeChoseong(char))

/**
 * 검색어로 품종을 거른다. 빈 검색어면 그대로 돌려준다.
 * 이름과 다른 이름(별칭)을 함께 본다. 검색어가 초성으로만 되어 있으면(예: "ㅈㅇ") 초성끼리 비교하고, 띄어쓰기는 무시한다.
 * 이름이 검색어로 시작하는 품종을 앞에 두고, 나머지는 원래 순서(가나다)를 따른다.
 */
export function matchFoods(foods: readonly Food[], query: string): readonly Food[] {
  const q = compact(query)
  if (!q) return foods
  const toKey = isChoseongQuery(q) ? (text: string) => compact(getChoseong(text)) : compact

  const startsWith: Food[] = []
  const includes: Food[] = []
  for (const food of foods) {
    const name = toKey(food.name)
    if (name.startsWith(q)) startsWith.push(food)
    else if (name.includes(q) || food.aliases.some((alias) => toKey(alias).includes(q))) includes.push(food)
  }
  return [...startsWith, ...includes]
}
