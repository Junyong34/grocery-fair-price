// 제안 하나를 카탈로그 사본에 반영하고, 변경 기록으로 되돌린다 (catalog-scale/08). 순수 함수다.
// DB에는 importSnapshot이 넣고 바뀐 분류 단위를 catalog_change에 남긴다 (proposals.ts).
import type { ProposalEntry } from "./proposal.ts"
import type { CatalogChange, Source } from "./rules.ts"
import type { CatalogSnapshot, ItemDef, SpecDef, VarietyDef } from "./types.ts"

type Mutable<T> = { -readonly [K in keyof T]: T[K] }
type EditInput = Pick<ProposalEntry, "source" | "key" | "kind" | "proposal">

const keyValue = (source: Source, key: string): string | number => (source === "chamga" ? Number(key) : key)

// 규격에서 원천 키 하나를 뗀다. 목록이 비면 그 필드를 지운다 (사본에 빈 배열을 두지 않는다)
function withoutKey(spec: SpecDef, source: Source, key: string): SpecDef {
  const list = spec[source] as readonly (string | number)[] | undefined
  if (!list?.some((k) => String(k) === key)) return spec
  const rest = list.filter((k) => String(k) !== key)
  const out: Mutable<SpecDef> = { ...spec }
  if (rest.length > 0) (out as Record<string, unknown>)[source] = rest
  else delete out[source]
  return out
}

function withKey(spec: SpecDef, source: Source, key: string): SpecDef {
  const list = (spec[source] ?? []) as readonly (string | number)[]
  return { ...spec, [source]: [...list, keyValue(source, key)] }
}

// 원천 키는 규칙 하나뿐이다: 먼저 모든 규격과 예외에서 뗀다
function detach(snapshot: CatalogSnapshot, source: Source, key: string): CatalogSnapshot {
  return {
    ...snapshot,
    varieties: snapshot.varieties.map((v) => ({ ...v, specs: v.specs.map((s) => withoutKey(s, source, key)) })),
    exceptions: snapshot.exceptions.filter((e) => !(e.source === source && e.key === key)),
  }
}

function insertAfterLast<T>(list: readonly T[], value: T, same: (x: T) => boolean): T[] {
  const at = list.reduce((last, x, i) => (same(x) ? i : last), -1)
  return at < 0 ? [...list, value] : [...list.slice(0, at + 1), value, ...list.slice(at + 1)]
}

function variety(snapshot: CatalogSnapshot, slug: string): VarietyDef {
  const found = snapshot.varieties.find((v) => v.slug === slug)
  if (!found) throw new Error(`품종 ${slug}이 없다`)
  return found
}

function replaceVariety(snapshot: CatalogSnapshot, next: VarietyDef): CatalogSnapshot {
  return { ...snapshot, varieties: snapshot.varieties.map((v) => (v.slug === next.slug ? next : v)) }
}

export function editSnapshot(snapshot: CatalogSnapshot, entry: EditInput): CatalogSnapshot {
  const { source, key } = entry
  const p = entry.proposal
  switch (entry.kind) {
    case "map":
    case "product_item": {
      if (entry.kind === "product_item" && p.variety === undefined) return snapshot // 품목만 정한 상품: 사본(품종·규격)은 그대로다
      const [vSlug, sSlug] = [String(p.variety), String(p.spec)]
      const v = variety(snapshot, vSlug)
      if (!v.specs.some((s) => s.slug === sSlug)) throw new Error(`규격 ${vSlug}/${sSlug}이 없다`)
      const detached = detach(snapshot, source, key)
      const dv = variety(detached, vSlug)
      return replaceVariety(detached, { ...dv, specs: dv.specs.map((s) => (s.slug === sSlug ? withKey(s, source, key) : s)) })
    }
    case "new_spec": {
      const spec = p.spec as { slug: string; name: string }
      if (variety(snapshot, String(p.variety)).specs.some((s) => s.slug === spec.slug)) throw new Error(`규격 ${String(p.variety)}/${spec.slug}이 이미 있다`)
      const detached = detach(snapshot, source, key)
      const dv = variety(detached, String(p.variety))
      return replaceVariety(detached, { ...dv, specs: [...dv.specs, withKey({ slug: spec.slug, name: spec.name }, source, key)] })
    }
    case "new_variety": {
      const v = p.variety as { slug: string; name: string; unit: VarietyDef["unit"] }
      const spec = p.spec as { slug: string; name: string }
      if (snapshot.varieties.some((x) => x.slug === v.slug)) throw new Error(`품종 ${v.slug}이 이미 있다`)
      const detached = detach(snapshot, source, key)
      let items = detached.items as readonly ItemDef[]
      let itemSlug: string
      if (typeof p.item === "string") {
        if (!items.some((i) => i.slug === p.item)) throw new Error(`품목 ${p.item}이 없다`)
        itemSlug = p.item
      } else {
        const item = p.item as ItemDef
        if (items.some((i) => i.slug === item.slug)) throw new Error(`품목 ${item.slug}이 이미 있다`)
        if (!detached.categories.some((c) => c.slug === item.category)) throw new Error(`카테고리 ${item.category}가 없다`)
        items = insertAfterLast(items, { slug: item.slug, name: item.name, category: item.category }, (i) => i.category === item.category)
        itemSlug = item.slug
      }
      const next: VarietyDef = { slug: v.slug, name: v.name, item: itemSlug, unit: v.unit, specs: [withKey({ slug: spec.slug, name: spec.name }, source, key)] }
      return { ...detached, items, varieties: insertAfterLast(detached.varieties, next, (x) => x.item === itemSlug) }
    }
    case "ignore":
    case "hold": {
      const detached = detach(snapshot, source, key)
      return { ...detached, exceptions: [...detached.exceptions, { source, key, action: entry.kind, reason: String(p.reason) }] }
    }
    case "merge":
      throw new Error("묶기(merge)는 아직 적용하지 않는다 (07에서 정한다)")
  }
}

const GROUPS = {
  category: "categories",
  item: "items",
  variety: "varieties",
  exception: "exceptions",
  sourceCategory: "sourceCategories",
} as const satisfies Record<CatalogChange["target"], keyof CatalogSnapshot>

const idOf = (target: CatalogChange["target"], value: unknown): string => {
  const v = value as { slug?: string; source?: string; key?: string; code?: string }
  if (target === "exception") return `${v.source}:${v.key}`
  if (target === "sourceCategory") return `${v.source}:${v.code}`
  return String(v.slug)
}

// 변경 기록(diffSnapshots 모양)을 거꾸로 돌린다: 새로 생긴 것은 빼고, 고친 것은 전 값으로, 지운 것은 다시 넣는다
export function revertSnapshot(snapshot: CatalogSnapshot, changes: readonly CatalogChange[]): CatalogSnapshot {
  const out: Mutable<CatalogSnapshot> = { ...snapshot }
  for (const c of [...changes].reverse()) {
    const group = GROUPS[c.target]
    const list = out[group] as readonly unknown[]
    if (c.action === "insert") out[group] = list.filter((x) => idOf(c.target, x) !== c.targetKey) as never
    else if (c.action === "update") out[group] = list.map((x) => (idOf(c.target, x) === c.targetKey ? c.before : x)) as never
    else out[group] = [...list, c.before] as never
  }
  return out
}
