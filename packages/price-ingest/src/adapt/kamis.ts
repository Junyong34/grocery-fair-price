// KAMIS perDay 행 → 관측값 초안 (pipeline 3-11 KAMIS 열).
import type { KamisPerDayQuery, KamisRow } from "../sources/kamis.ts"
import { isPositiveInt, priceFlags, RowRejectedError, ymdFromCompact, type ObservationDraft } from "./draft.ts"
import type { AdaptContext } from "./mapping.ts"
import { pricePerBase } from "./units.ts"

const NO_PROMO = { discount: null, onePlusOne: null, from: null, to: null }

export type KamisRequest = Pick<KamisPerDayQuery, "seCd" | "fromYmd" | "toYmd">

// 행 단위 거부 사유 (pipeline 3-11). 요청을 주면 요청과 맞는지도 본다. 거부할 이유가 없으면 null.
export function kamisRowRejection(row: KamisRow, request?: KamisRequest): string | null {
  if (request && row.se_cd !== request.seCd) return "구분 코드가 요청과 다르다"
  // MVP는 소매만 받는다. 도매는 기준 단위가 달라서 따로 정한다 (3-1 도매 메모, 3-12 #11)
  if (row.se_cd !== "01") return "구분 코드가 소매(01)가 아니다"
  if (request && (row.exmn_ymd < request.fromYmd || row.exmn_ymd > request.toYmd)) return "조사일이 요청 기간 밖이다"
  if (!isPositiveInt(row.exmn_dd_prc)) return "가격이 양의 정수가 아니다"
  if (!isPositiveInt(row.unit_sz)) return "단위 크기가 양의 정수가 아니다"
  // 시장 코드와 등록 시각이 비는 것은 축산(부류 500)뿐이다 (kamis.md 2-2)
  if (row.ctgry_cd !== "500" && (row.mrkt_cd === null || row.orgnl_reg_dt === null)) {
    return "축산이 아닌데 시장 코드나 등록 시각이 비었다"
  }
  return null
}

export function adaptKamisRow(row: KamisRow, ctx: AdaptContext): ObservationDraft {
  const rejection = kamisRowRejection(row)
  if (rejection) throw new RowRejectedError(rejection)

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
