// 제안 검토 화면의 순수한 부분 (catalog-scale/07). 제안 모양은 packages/price-ingest/src/catalog/proposal.ts의 proposalOf다.
export type ProposalKind = "map" | "new_spec" | "new_variety" | "product_item" | "ignore" | "hold" | "merge"

export const KIND_LABEL: Record<ProposalKind, string> = {
  map: "기존 규격에 잇기",
  new_spec: "새 규격",
  new_variety: "새 식재료",
  product_item: "상품의 품목",
  ignore: "제외",
  hold: "보류",
  merge: "묶기",
}

export const CONFIDENCE_LABEL = { high: "높음", medium: "중간", low: "낮음" } as const

// slug → 이름 (화면에 slug 대신 보인다)
export type CatalogNames = {
  varieties: Record<string, { name: string; specs: Record<string, string> }>
  items: Record<string, string>
  categories: Record<string, string>
}

type Named = { slug: string; name: string }
type NewItem = Named & { category: string }
type ProposalLike = { kind: ProposalKind; proposal: Record<string, unknown> }

const newItemLabel = (item: NewItem, names: CatalogNames) => `새 품목 「${item.name}」(${names.categories[item.category] ?? item.category})`

// 상품의 품목·새 식재료 제안이 가리키는 품목. 화면에서 품목별로 좁혀 볼 때 쓴다
export function targetItemOf(p: ProposalLike, names: CatalogNames): { slug: string; label: string } | null {
  if (p.kind !== "product_item" && p.kind !== "new_variety") return null
  const item = p.proposal.item as string | NewItem
  if (typeof item === "string") return { slug: item, label: names.items[item] ?? item }
  return { slug: item.slug, label: `${item.name} (새 품목 · ${names.categories[item.category] ?? item.category})` }
}

export function describeProposal(p: ProposalLike, names: CatalogNames): string {
  const q = p.proposal
  const varietyName = (slug: unknown) => names.varieties[String(slug)]?.name ?? String(slug)
  const specName = (variety: unknown, spec: unknown) => names.varieties[String(variety)]?.specs[String(spec)] ?? String(spec)
  switch (p.kind) {
    case "map":
    case "merge":
      return `${varietyName(q.variety)} · ${specName(q.variety, q.spec)}${p.kind === "map" ? "에 잇기" : "로 묶기"}`
    case "new_spec":
      return `${varietyName(q.variety)}에 새 규격 「${(q.spec as Named).name}」`
    case "new_variety": {
      const item = typeof q.item === "string" ? (names.items[q.item] ?? q.item) : newItemLabel(q.item as NewItem, names)
      const v = q.variety as Named & { unit: string }
      return `${item}에 새 식재료 「${v.name}」 (${v.unit}, 규격 ${(q.spec as Named).name})`
    }
    case "product_item": {
      const item = typeof q.item === "string" ? (names.items[q.item] ?? q.item) : newItemLabel(q.item as NewItem, names)
      return q.variety === undefined ? `상품의 품목을 ${item}로` : `상품의 품목을 ${item}로, ${varietyName(q.variety)} · ${specName(q.variety, q.spec)}에 잇기`
    }
    case "ignore":
    case "hold":
      return String(q.reason)
  }
}

export function countByKind(rows: readonly { kind: ProposalKind }[]): Partial<Record<ProposalKind, number>> {
  const out: Partial<Record<ProposalKind, number>> = {}
  for (const r of rows) out[r.kind] = (out[r.kind] ?? 0) + 1
  return out
}
