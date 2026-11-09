import { matchRange } from "@workspace/price/search"

/** 이름에서 검색어가 맞은 글자를 강조한다. 식재료 · 상품 결과가 같이 쓴다. */
export function Highlighted({ name, query }: { name: string; query: string }) {
  const range = matchRange(name, query)
  if (!range) return name
  const chars = [...name]
  return (
    <>
      {chars.slice(0, range[0]).join("")}
      <mark className="rounded-sm bg-gold-wash text-ink">
        {chars.slice(range[0], range[1]).join("")}
      </mark>
      {chars.slice(range[1]).join("")}
    </>
  )
}
