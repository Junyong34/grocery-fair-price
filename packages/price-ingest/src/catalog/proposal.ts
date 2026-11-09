// 카탈로그 제안 흐름의 순수한 부분 (catalog-scale/06). DB를 읽고 쓰는 쪽은 pending.ts.
//   keyPatternOf: 원천 필드 → catalog_key_rule.key_pattern 표기
//   similarVarieties: pending 원천 키 하나에 비슷한 기존 품종 (같은 원천 코드의 규칙, 이름이 같은 품종)
//   parseProposalFile: 로컬 에이전트가 쓴 제안 파일을 검사한다. 하나라도 틀리면 파일 전체를 받지 않는다
import { z } from "zod"

import type { Rule, Source } from "./rules.ts"

type KeyParts = Record<string, string | undefined>

const KEY_FIELDS: Record<Source, readonly string[]> = {
  kamis: ["item_cd", "vrty_cd", "grd_cd"],
  ekape: ["judgeKind", "itemCd", "grdNm"],
  chamga: ["goodId"],
}

export function keyPatternOf(source: Source, parts: KeyParts): string {
  const values = KEY_FIELDS[source].map((f) => parts[f])
  if (values.some((v) => v === undefined || v === "")) throw new Error(`${source} 원천 키 필드가 모자라다: ${JSON.stringify(parts)}`)
  return values.join("-")
}

const DAY_MS = 86_400_000

// 최근 days일 안에 관측됐나 (KAMIS 관측값은 90일 뒤 지워지니 최근 것부터 다룬다). days가 없으면 모두
export function recentEnough(lastSeen: string, today: string, days: number | undefined): boolean {
  if (days === undefined) return true
  return Date.parse(today) - Date.parse(lastSeen) <= days * DAY_MS
}

export type CatalogVarietyRef = { slug: string; name: string; item: string; itemName: string; specs: readonly string[] }
export type SimilarVarieties = { sameCode: Rule[]; byName: CatalogVarietyRef[] }

// 괄호·공백·`/` 앞 이름 (`참깨(국산)` → `참깨`, `고등어/국산(냉동)/大` → `고등어`)
const headOf = (name: string) => name.split(/[/(\s]/)[0]?.trim() ?? ""

// 같은 원천 코드(KAMIS 품목 코드, 축평원 축종-품목코드)의 규칙과, 이름이 같은 품종.
// 이름이 같다고 같은 규격은 아니다 (catalog-evolution/03). 제안하는 쪽이 원산지·등급·크기·보관 상태를 다시 본다
export function similarVarieties(
  entry: { source: Source; key: string; label: string | null },
  varieties: readonly CatalogVarietyRef[],
  rules: readonly Rule[],
): SimilarVarieties {
  const codePrefix = entry.source === "kamis" ? entry.key.split("-")[0] : entry.source === "ekape" ? entry.key.split("-").slice(0, 2).join("-") : null
  const sameCode = codePrefix
    ? rules.filter((r) => r.source === entry.source && r.key !== entry.key && r.key.startsWith(`${codePrefix}-`))
    : []
  const head = entry.label ? headOf(entry.label) : ""
  const byName = head ? varieties.filter((v) => headOf(v.name) === head || v.itemName === head) : []
  return { sameCode, byName }
}

const slug = z.string().regex(/^[a-z0-9-]+$/)
const named = z.strictObject({ slug, name: z.string().min(1) })
const reason = z.strictObject({ reason: z.string().min(1) })
// 품목: 있는 품목의 slug, 또는 새로 만들 품목 (같은 새 품목을 여러 제안이 가리켜도 된다. 처음 적용할 때 만든다)
const itemRef = z.union([slug, z.strictObject({ slug, name: z.string().min(1), category: slug })])

// kind마다 proposal 모양 (catalog_proposal.proposal). 승인 적용(08)이 이 모양을 읽는다
const proposalOf = {
  map: z.strictObject({ variety: slug, spec: slug }),
  new_spec: z.strictObject({ variety: slug, spec: named }),
  new_variety: z.strictObject({
    item: itemRef,
    variety: z.strictObject({ slug, name: z.string().min(1), unit: z.enum(["100g", "1kg", "10kg", "1개", "30구", "1L"]) }),
    spec: named,
  }),
  product_item: z.strictObject({ item: itemRef, variety: slug.optional(), spec: slug.optional() }),
  ignore: reason,
  hold: reason,
  merge: z.strictObject({ variety: slug, spec: slug }),
} as const

export type ProposalKind = keyof typeof proposalOf

const head = {
  source: z.enum(["kamis", "ekape", "chamga"]),
  key: z.string().min(1),
  rationale: z.string().trim().min(1),
  confidence: z.enum(["high", "medium", "low"]).nullish().transform((c) => c ?? null),
}
const entrySchema = z.discriminatedUnion(
  "kind",
  (Object.keys(proposalOf) as ProposalKind[]).map((kind) => z.strictObject({ ...head, kind: z.literal(kind), proposal: proposalOf[kind] })) as unknown as [
    z.ZodObject,
    ...z.ZodObject[],
  ],
)

export type ProposalEntry = {
  source: Source
  key: string
  kind: ProposalKind
  proposal: Record<string, unknown>
  rationale: string
  confidence: "high" | "medium" | "low" | null
}

export function parseProposalFile(value: unknown): ProposalEntry[] {
  const entries = z.array(entrySchema).parse(value) as ProposalEntry[]
  const seen = new Set<string>()
  for (const e of entries) {
    const id = `${e.source}:${e.key}`
    if (seen.has(id)) throw new Error(`제안 파일에 원천 키 ${id}가 두 번 있다`)
    seen.add(id)
  }
  return entries
}
