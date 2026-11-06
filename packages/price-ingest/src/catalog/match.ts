// 원천 키가 카탈로그의 어느 품종·규격에 잇는지 (ingest-foundation/08)
import { BASE_UNITS, VARIETIES, type VarietyDef } from "./varieties.ts"

export type CatalogTarget = {
  variety: string // 품종 slug
  spec: string // 규격 slug
  unitRule: string // unit_rule.rule_code
  role: "primary" | "secondary"
}

// 기준 단위 계열마다 단위 규칙 하나 (같은 계열 안에서만 나눈다, pipeline 3-1)
export const UNIT_RULES = [
  { rule_code: "retail-g", from_unit: "g" },
  { rule_code: "retail-ea", from_unit: "ea" },
  { rule_code: "retail-ml", from_unit: "ml" },
] as const

export function unitRuleOf(v: VarietyDef): string {
  return `retail-${BASE_UNITS[v.unit].base_unit}`
}

type KeyParts = Record<string, string | undefined>

const kamisIndex = new Map<string, CatalogTarget>() // `품목-품종-등급`, 품종 `*` 포함
const ekapeIndex = new Map<string, CatalogTarget>()
const chamgaIndex = new Map<number, CatalogTarget>()

for (const v of VARIETIES) {
  for (const s of v.specs) {
    const base = { variety: v.slug, spec: s.slug, unitRule: unitRuleOf(v) }
    // 축산은 두 출처에 다 있으면 축평원이 대표 (pipeline 6-1)
    const kamisRole = s.ekape?.length ? "secondary" : "primary"
    for (const k of s.kamis ?? []) kamisIndex.set(k, { ...base, role: kamisRole })
    for (const k of s.ekape ?? []) ekapeIndex.set(k, { ...base, role: "primary" })
    for (const id of s.chamga ?? []) chamgaIndex.set(id, { ...base, role: "primary" })
  }
}

// KAMIS는 소매(구분 01)만 잇는다
export function kamisTarget(parts: KeyParts): CatalogTarget | undefined {
  if (parts.se_cd !== "01") return undefined
  return kamisIndex.get(`${parts.item_cd}-${parts.vrty_cd}-${parts.grd_cd}`) ?? kamisIndex.get(`${parts.item_cd}-*-${parts.grd_cd}`)
}

// KAMIS가 대표인 원천 키가 하나라도 있는 품목 코드 (백필이 받을 품목, ingest-foundation/04)
export function kamisPrimaryItemCodes(): Set<string> {
  return new Set([...kamisIndex].filter(([, target]) => target.role === "primary").map(([key]) => key.split("-")[0]!))
}

export function ekapeTarget(parts: KeyParts): CatalogTarget | undefined {
  return ekapeIndex.get(`${parts.judgeKind}-${parts.itemCd}-${parts.grdNm}`)
}

export function chamgaTarget(goodId: number): CatalogTarget | undefined {
  return chamgaIndex.get(goodId)
}

// 실제 소매 데이터가 오지만 일부러 어느 규격에도 잇지 않는 KAMIS 코드(`품목-품종-등급`)와 이유.
// 카탈로그에서 빼도 이미 열린 매핑은 매핑 적용이 고치지 않는다. 운영 DB에서는 그 매핑을 ignored로 바꿔 둔다.
export const KAMIS_EXCLUDED: ReadonlyMap<string, string> = new Map([
  ["111-01-04", "쌀 20kg: 쌀은 10kg 기준이다. 같은 날 kg당 10kg보다 중간 14% 싸서 섞으면 10kg 가격표와 어긋난다 (2026-11-06)"],
  ["111-05-04", "쌀 20kg(햅쌀): 위와 같다 (2026-11-06)"],
])

// 신선식품이지만 아직 품종에 잇지 않는 참가격 상품. 매핑 적용이 ignored로 바꾸지 않고 pending으로 둔다
export const CHAMGA_UNDECIDED: ReadonlyMap<number, string> = new Map([
  [1738, "볶음참깨: 원산지가 없어 참깨(국산)·(중국)을 고를 수 없다"],
  [1786, "볶음참깨: 원산지가 없어 참깨(국산)·(중국)을 고를 수 없다"],
  [1787, "볶음참깨: 원산지가 없어 참깨(국산)·(중국)을 고를 수 없다"],
  [1788, "볶음참깨: 원산지가 없어 참깨(국산)·(중국)을 고를 수 없다"],
  [1789, "볶음참깨: 원산지가 없어 참깨(국산)·(중국)을 고를 수 없다"],
])
