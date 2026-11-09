// 카탈로그 모양 (catalog-scale/04, ADR 0005). 원본은 운영 DB의 price 표이고, snapshot.json은 그 사본이다
// (catalog export가 쓰고 catalog import가 읽는다). 사람이 읽는 표는 grocery-price/docs/30-data/variety-list.md.
//
// 원천 키 표기 (규격마다):
//   KAMIS  `품목-품종-등급` (구분 01 소매만). 품종 `*`는 철마다 바뀌는 코드 (배추·무)
//   축평원 `축종-품목코드-구분명`
//   참가격 goodId (신선식품만, 가공식품은 품종에 잇지 않는다)

export type CategoryDef = { slug: string; name: string }
export type ItemDef = { slug: string; name: string; category: string }

export type SpecDef = {
  slug: string
  name: string
  kamis?: readonly string[]
  ekape?: readonly string[]
  chamga?: readonly number[]
}

// 기준 단위 (variety-list.md 규칙 5)
export type BaseUnit = "100g" | "1kg" | "10kg" | "1개" | "30구" | "1L"

export type VarietyDef = {
  slug: string
  name: string
  item: string
  unit: BaseUnit
  status?: "hidden" // 없으면 활성. 숨긴 품종은 화면에 나오지 않지만 관측값·집계가 가리킬 수 있어 지우지 않는다
  specs: readonly SpecDef[] // 첫째가 기본 규격
  seasonal?: readonly string[] // packages/seasonal의 품종 id
  // brand: 매장의 같은 품종 안에서도 품종(쌀의 신동진 · 고시히카리 등) · 브랜드 · 도정일마다 값이 크게 달라
  // 시세 하나로 "이 쌀이 싸다"를 말할 수 없다. 판정은 그대로 두고 화면이 안내 한 줄을 붙인다 (judgment.md 5-3)
  spread?: "brand"
}

// 규격에 잇지 않는 원천 키. ignore: 일부러 잇지 않는다. hold: 근거가 없어 미룬다(pending으로 둔다)
export type CatalogException = { source: "kamis" | "ekape" | "chamga"; key: string; action: "ignore" | "hold"; reason: string }

export type CatalogSnapshot = {
  categories: readonly CategoryDef[]
  items: readonly ItemDef[]
  varieties: readonly VarietyDef[]
  exceptions: readonly CatalogException[]
}

export const BASE_UNITS: Record<BaseUnit, { base_unit: "g" | "ea" | "ml"; base_unit_qty: number }> = {
  "100g": { base_unit: "g", base_unit_qty: 100 },
  "1kg": { base_unit: "g", base_unit_qty: 1000 },
  "10kg": { base_unit: "g", base_unit_qty: 10000 },
  "1개": { base_unit: "ea", base_unit_qty: 1 },
  "30구": { base_unit: "ea", base_unit_qty: 30 },
  "1L": { base_unit: "ml", base_unit_qty: 1000 },
}

// 기준 단위 계열마다 단위 규칙 하나 (같은 계열 안에서만 나눈다, pipeline 3-1)
export const UNIT_RULES = [
  { rule_code: "retail-g", from_unit: "g" },
  { rule_code: "retail-ea", from_unit: "ea" },
  { rule_code: "retail-ml", from_unit: "ml" },
] as const

export function unitRuleOf(unit: BaseUnit): string {
  return `retail-${BASE_UNITS[unit].base_unit}`
}

export function baseUnitLabel(baseUnit: string, qty: number): string {
  return (Object.entries(BASE_UNITS) as [BaseUnit, (typeof BASE_UNITS)[BaseUnit]][]).find(
    ([, u]) => u.base_unit === baseUnit && u.base_unit_qty === qty,
  )?.[0] ?? `${qty}${baseUnit}`
}
