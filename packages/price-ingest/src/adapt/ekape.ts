// 축평원 consumerPriceDaily 행 → 관측값 초안 또는 평년 기준 값 (pipeline 3-11 축평원 열).
import type { EkapeRow } from "../sources/ekape.ts"
import { priceFlags, ymdFromCompact, type Flag, type ObservationDraft, type ReferenceDraft } from "./draft.ts"
import type { AdaptContext } from "./mapping.ts"
import { pricePerBase } from "./units.ts"

// 축종별로 고정된 단위 (ekape.md 2장). 다르면 환산하지 않고 경고한다 (3-12 #12)
const EXPECTED_UNIT = new Map<string, string>([
  ["4301", "원/100g"],
  ["4304", "원/100g"],
  ["4401", "원/100g"],
  ["4402", "원/100g"],
  ["9901", "원/Kg"],
  ["9903", "원/30구"],
  ["9908", "원/1L"],
])

const NO_PROMO = { discount: null, onePlusOne: null, from: null, to: null }

export type EkapeContext = AdaptContext & { requestedYmd: string }

// "원/100g" → 수량 100, 단위 g. "원/Kg" → 수량 1, 단위 Kg.
function parseEkapeUnit(unit: string): { qty: number; unitText: string } | undefined {
  const match = /^원\/(\d*)(.+)$/.exec(unit)
  if (!match) return undefined
  return { qty: match[1] ? Number(match[1]) : 1, unitText: match[2] ?? "" }
}

export function adaptEkapeRow(row: EkapeRow, ctx: EkapeContext): ObservationDraft | ReferenceDraft {
  // 원천 키: 축종·품목·등급(grdNm) (3-11). 등급 값이 무엇인지(규격인지 원산지인지)는 매핑이 정한다 (3-12 #1)
  const sourceKey = [row.judgeKind, row.itemCd, row.grdNm].join("-")
  const placeKey = "national"
  const priceRaw = Number(row.ntslPrc)
  const isReference = row.standYmd === "평년"
  const date = ymdFromCompact(isReference ? ctx.requestedYmd : row.standYmd)

  const expectedUnit = EXPECTED_UNIT.get(row.judgeKind)
  const unitMatches = expectedUnit === row.unit
  const parsed = parseEkapeUnit(row.unit)
  const link = ctx.mapping("ekape", sourceKey, date)
  const perBase =
    link && unitMatches && parsed ? pricePerBase(priceRaw, parsed.qty, parsed.unitText, link.base) : null
  const flags: Flag[] = [...priceFlags(priceRaw)]
  if (!unitMatches) flags.push("unit_mismatch")

  if (isReference) {
    return {
      recordKind: "reference",
      source: "ekape",
      sourceKey,
      placeKey,
      refDate: date,
      priceRaw,
      unitRaw: row.unit,
      pricePerBase: perBase,
      varietyKey: link?.varietyKey ?? null,
      specKey: link?.specKey ?? null,
      flags,
    }
  }

  return {
    recordKind: "observation",
    source: "ekape",
    sourceKey,
    placeKey,
    obsDate: date,
    priceTier: "retail",
    obsKind: "quote_aggregate",
    priceRaw,
    qtyRaw: parsed?.qty ?? null,
    unitRaw: row.unit,
    pricePerBase: perBase,
    varietyKey: link?.varietyKey ?? null,
    specKey: link?.specKey ?? null,
    promo: { ...NO_PROMO },
    sourceRegisteredAt: null,
    flags,
  }
}
