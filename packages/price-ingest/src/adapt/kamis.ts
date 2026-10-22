// KAMIS perDay 행 → 관측값 초안 (pipeline 3-11 KAMIS 열).
import type { KamisRow } from "../sources/kamis.ts"
import { priceFlags, ymdFromCompact, type ObservationDraft } from "./draft.ts"
import type { AdaptContext } from "./mapping.ts"
import { pricePerBase } from "./units.ts"

const NO_PROMO = { discount: null, onePlusOne: null, from: null, to: null }

export function adaptKamisRow(row: KamisRow, ctx: AdaptContext): ObservationDraft {
  // MVP는 소매만 받는다. 도매는 기준 단위가 달라서 따로 정한다 (3-1 도매 메모, 3-12 #11)
  if (row.se_cd !== "01") throw new Error("MVP는 소매(se_cd 01)만 받는다")

  // 원천 키: 구분·부류·품목·품종·등급 코드 (3-11). 이름과 환산가는 쓰지 않는다 (3-12 #3 #4 #23)
  const sourceKey = [row.se_cd, row.ctgry_cd, row.item_cd, row.vrty_cd, row.grd_cd].join("-")
  // 시장이 있으면 시장 코드로, 축산처럼 시장이 없으면 지역 코드로 장소를 잡는다 (5장: 신원은 코드)
  const placeKey = row.mrkt_cd ? `market:${row.mrkt_cd}` : `region:${row.sgg_cd}`
  const obsDate = ymdFromCompact(row.exmn_ymd)
  const priceRaw = Number(row.exmn_dd_prc)
  const qtyRaw = Number(row.unit_sz)

  const link = ctx.mapping("kamis", sourceKey, obsDate)
  return {
    recordKind: "observation",
    source: "kamis",
    sourceKey,
    placeKey,
    obsDate,
    priceTier: "retail",
    obsKind: row.mrkt_cd ? "quote_sample" : "quote_aggregate",
    priceRaw,
    qtyRaw,
    unitRaw: row.unit,
    pricePerBase: link ? pricePerBase(priceRaw, qtyRaw, row.unit, link.base) : null,
    varietyKey: link?.varietyKey ?? null,
    specKey: link?.specKey ?? null,
    promo: { ...NO_PROMO },
    sourceRegisteredAt: row.orgnl_reg_dt,
    flags: priceFlags(priceRaw),
  }
}
