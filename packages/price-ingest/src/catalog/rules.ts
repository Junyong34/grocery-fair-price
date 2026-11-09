// 원천 키 규칙 (catalog-scale/04, ADR 0005). 원본은 price.catalog_key_rule이다.
// 아직 들어온 적 없는 원천 키를 어느 규격에 이을지(map), 일부러 잇지 않을지(ignore), 미룰지(hold)를 정한다.
// 적재가 처음 본 키를 이 규칙으로 잇고(apply.ts), 백필이 받을 KAMIS 품목을 고른다(backfill/plan.ts).
import { unitRuleOf, type CatalogSnapshot } from "./types.ts"

export type Source = "kamis" | "ekape" | "chamga"

export type Rule = {
  source: Source
  key: string // catalog_key_rule.key_pattern
  action: "map" | "ignore" | "hold"
  variety: string | null // 품종 slug (map만)
  spec: string | null // 규격 slug (map만)
  unitRule: string | null // unit_rule.rule_code (map만)
  role: "primary" | "secondary" | null // map만
  reason: string | null
}

// snapshot의 규격 키와 예외를 규칙 행으로. 원천 키 하나는 규칙 하나뿐이다
export function rulesOfSnapshot(snapshot: CatalogSnapshot): Rule[] {
  const rules: Rule[] = []
  for (const v of snapshot.varieties) {
    for (const s of v.specs) {
      const base = { action: "map" as const, variety: v.slug, spec: s.slug, unitRule: unitRuleOf(v.unit), reason: null }
      // 축산은 두 출처에 다 있으면 축평원이 대표 (pipeline 6-1)
      const kamisRole = s.ekape?.length ? "secondary" : "primary"
      for (const key of s.kamis ?? []) rules.push({ source: "kamis", key, ...base, role: kamisRole })
      for (const id of s.chamga ?? []) rules.push({ source: "chamga", key: String(id), ...base, role: "primary" })
      for (const key of s.ekape ?? []) rules.push({ source: "ekape", key, ...base, role: "primary" })
    }
  }
  for (const e of snapshot.exceptions) {
    rules.push({ source: e.source, key: e.key, action: e.action, variety: null, spec: null, unitRule: null, role: null, reason: e.reason })
  }
  const seen = new Set<string>()
  for (const r of rules) {
    const id = `${r.source}:${r.key}`
    if (seen.has(id)) throw new Error(`원천 키 ${id}에 규칙이 둘 이상이다`)
    seen.add(id)
  }
  return rules
}

type KeyParts = Record<string, string | undefined>

export class CatalogIndex {
  private readonly bySource: Record<Source, Map<string, Rule>> = { kamis: new Map(), ekape: new Map(), chamga: new Map() }

  constructor(rules: readonly Rule[]) {
    for (const r of rules) this.bySource[r.source].set(r.key, r)
  }

  // KAMIS는 소매(구분 01)만 잇는다. 정확한 키가 없으면 품종 `*`(철마다 바뀌는 코드)로 찾는다
  kamis(parts: KeyParts): Rule | undefined {
    if (parts.se_cd !== "01") return undefined
    const map = this.bySource.kamis
    return map.get(`${parts.item_cd}-${parts.vrty_cd}-${parts.grd_cd}`) ?? map.get(`${parts.item_cd}-*-${parts.grd_cd}`)
  }

  ekape(parts: KeyParts): Rule | undefined {
    return this.bySource.ekape.get(`${parts.judgeKind}-${parts.itemCd}-${parts.grdNm}`)
  }

  chamga(goodId: number): Rule | undefined {
    return this.bySource.chamga.get(String(goodId))
  }

  // KAMIS가 대표인 규칙이 하나라도 있는 품목 코드 (백필이 받을 품목, ingest-foundation/04)
  kamisPrimaryItemCodes(): Set<string> {
    return new Set([...this.bySource.kamis.values()].filter((r) => r.action === "map" && r.role === "primary").map((r) => r.key.split("-")[0]!))
  }
}

export type CatalogChange = {
  target: "category" | "item" | "variety" | "exception" | "sourceCategory"
  targetKey: string
  action: "insert" | "update" | "delete"
  before: unknown
  after: unknown
}

// 키 순서와 상관없이 같은 값이면 같은 문자열
function canonical(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v,
  )
}

// 두 사본의 차이를 분류 단위(카테고리·품목·품종(규격·원천 키·제철 포함)·예외)로. 가져오기가 변경 기록(catalog_change)에 남긴다
export function diffSnapshots(before: CatalogSnapshot, after: CatalogSnapshot): CatalogChange[] {
  const groups: [CatalogChange["target"], (s: CatalogSnapshot) => [string, unknown][]][] = [
    ["category", (s) => s.categories.map((c) => [c.slug, c])],
    ["item", (s) => s.items.map((i) => [i.slug, i])],
    ["variety", (s) => s.varieties.map((v) => [v.slug, v])],
    ["exception", (s) => s.exceptions.map((e) => [`${e.source}:${e.key}`, e])],
    ["sourceCategory", (s) => s.sourceCategories.map((e) => [`${e.source}:${e.code}`, e])],
  ]
  const changes: CatalogChange[] = []
  for (const [target, entries] of groups) {
    const was = new Map(entries(before))
    const now = new Map(entries(after))
    for (const [key, value] of now) {
      if (!was.has(key)) changes.push({ target, targetKey: key, action: "insert", before: null, after: value })
      else if (canonical(was.get(key)) !== canonical(value)) changes.push({ target, targetKey: key, action: "update", before: was.get(key), after: value })
    }
    for (const [key, value] of was) if (!now.has(key)) changes.push({ target, targetKey: key, action: "delete", before: value, after: null })
  }
  return changes
}
