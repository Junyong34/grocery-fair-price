// 단위 환산. 원천 가격을 기준 단위 가격으로 바꾼다 (pipeline 3-1 계산식):
//   price_per_base = 원천 가격 ÷ (원천 수량을 기준 단위로 바꾼 값) × base_unit_qty
// 단위가 맞지 않고 환산 기준도 없으면 null이다.

export type BaseRule = { kind: "same_unit" } | { kind: "weight_to_ea" | "ea_to_weight"; gPerEa: number }

export type BaseUnit = {
  unit: string // 기준 단위 이름: g, kg, ml, L, ea, 포기 ...
  qty: number // base_unit_qty: 100 (100g당), 1 (1포기당) ...
  rule?: BaseRule // 무게↔개수 환산 기준. 없으면 같은 단위끼리만 환산한다
}

type Measure = { family: "mass"; grams: number } | { family: "volume"; ml: number } | { family: "count"; name: string }

const MASS = new Map<string, number>([
  ["g", 1],
  ["G", 1],
  ["kg", 1000],
  ["KG", 1000],
  ["Kg", 1000],
])
const VOLUME = new Map<string, number>([
  ["ml", 1],
  ["ML", 1],
  ["mL", 1],
  ["l", 1000],
  ["L", 1000],
])
// 개수 단위. 한 덩이로 세는 단위(개·구·포기·마리·장)는 모두 1개(ea)다: 품종의 기준 단위 "1개"는 배추면 1포기,
// 생선이면 1마리다 (variety-list.md 규칙 5). 손(고등어 2마리)·단·망은 묶음이라 따로 둔다 (3-12 #10).
// 영문은 참가격 UT 코드다.
const COUNT = new Map<string, string>([
  ["개", "ea"],
  ["ea", "ea"],
  ["EA", "ea"],
  ["구", "ea"],
  ["포기", "ea"],
  ["PK", "ea"],
  ["마리", "ea"],
  ["MR", "ea"],
  ["장", "ea"],
  ["손", "손"],
  ["단", "단"],
  ["DA", "단"],
  ["망", "망"],
  ["MA", "망"],
])

// SQL 환산(load/variety.ts)이 같은 표를 쓴다. family별 factor: 질량은 g, 부피는 ml, 개수는 1
export const UNIT_TABLE: readonly { unit: string; family: "mass" | "volume" | "count"; factor: number; name: string | null }[] = [
  ...[...MASS].map(([unit, grams]) => ({ unit, family: "mass" as const, factor: grams, name: null })),
  ...[...VOLUME].map(([unit, ml]) => ({ unit, family: "volume" as const, factor: ml, name: null })),
  ...[...COUNT].map(([unit, name]) => ({ unit, family: "count" as const, factor: 1, name })),
]

export function parseMeasure(unitText: string): Measure | undefined {
  const text = unitText.trim()
  const grams = MASS.get(text)
  if (grams !== undefined) return { family: "mass", grams }
  const ml = VOLUME.get(text)
  if (ml !== undefined) return { family: "volume", ml }
  const name = COUNT.get(text)
  if (name !== undefined) return { family: "count", name }
  return undefined
}

// 원천 수량을 기준 단위로 바꾼 값. 환산할 수 없으면 null.
function quantityInBase(raw: Measure, qty: number, target: Measure, rule: BaseRule): number | null {
  if (raw.family === "mass" && target.family === "mass") return (qty * raw.grams) / target.grams
  if (raw.family === "volume" && target.family === "volume") return (qty * raw.ml) / target.ml
  if (raw.family === "count" && target.family === "count") return raw.name === target.name ? qty : null
  if (rule.kind === "weight_to_ea" && raw.family === "mass" && target.family === "count") {
    return (qty * raw.grams) / rule.gPerEa
  }
  if (rule.kind === "ea_to_weight" && raw.family === "count" && target.family === "mass") {
    return (qty * rule.gPerEa) / target.grams
  }
  return null
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function pricePerBase(priceRaw: number, qtyRaw: number, unitRaw: string, base: BaseUnit): number | null {
  const raw = parseMeasure(unitRaw)
  const target = parseMeasure(base.unit)
  if (!raw || !target || qtyRaw <= 0) return null
  const inBase = quantityInBase(raw, qtyRaw, target, base.rule ?? { kind: "same_unit" })
  if (inBase === null || inBase <= 0) return null
  return round2((priceRaw / inBase) * base.qty)
}
