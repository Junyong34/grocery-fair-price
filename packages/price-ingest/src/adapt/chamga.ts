// 참가격 goodPriceVO 행 → 관측값 초안 (pipeline 3-11 참가격 열).
import type { ChamgaPriceRow } from "../sources/chamgagyeok.ts"
import { priceFlags, ymdFromCompact, type Flag, type ObservationDraft } from "./draft.ts"
import type { AdaptContext } from "./mapping.ts"
import { pricePerBase } from "./units.ts"

export type ChamgaProductInfo = { goodTotalCnt: string; goodTotalDivCode: string }

export type ChamgaContext = AdaptContext & {
  // 상품 용량 (goodTotalCnt·goodTotalDivCode). 가격 행에는 없어서 상품 정보에서 가져온다 (3-11)
  product: (goodId: string) => ChamgaProductInfo | undefined
}

// "2026-09-23 12:00:10" (KST, 표기 없음) → "2026-09-23T12:00:10+09:00"
function kstIso(inputDttm: string): string {
  const [date, time] = inputDttm.split(" ")
  return `${date}T${time}+09:00`
}

export function adaptChamgaPriceRow(row: ChamgaPriceRow, ctx: ChamgaContext): ObservationDraft {
  // 원천 키: 상품 번호(goodId) 그대로 (3-11). 같은 번호의 재사용 여부는 DB에서 본다 (3-12 #17)
  const sourceKey = row.goodId
  const obsDate = ymdFromCompact(row.goodInspectDay)
  const priceRaw = Number(row.goodPrice)
  const onePlusOne = row.plusoneYn === "Y"

  const link = ctx.mapping("chamgagyeok", sourceKey, obsDate)
  const product = ctx.product(sourceKey)
  // 1+1은 1개 값인지 묶음 값인지 아직 모른다. 확인 전에는 기준 단위 가격을 비운다 (3-12 #13)
  const perBase =
    link && product && !onePlusOne
      ? pricePerBase(priceRaw, Number(product.goodTotalCnt), product.goodTotalDivCode, link.base)
      : null

  const flags: Flag[] = [...priceFlags(priceRaw)]
  if (onePlusOne) flags.push("one_plus_one_unverified")

  return {
    recordKind: "observation",
    source: "chamgagyeok",
    sourceKey,
    placeKey: `store:${row.entpId}`,
    obsDate,
    priceTier: "retail",
    obsKind: "shelf_price",
    priceRaw,
    qtyRaw: null,
    unitRaw: null,
    pricePerBase: perBase,
    varietyKey: link?.varietyKey ?? null,
    specKey: link?.specKey ?? null,
    promo: {
      // 행사 필드가 없으면 "모름"이다. false로 바꾸지 않는다 (3-12 #14)
      discount: row.goodDcYn === undefined ? null : row.goodDcYn === "Y",
      onePlusOne: row.plusoneYn === undefined ? null : onePlusOne,
      // 행사 기간은 표시용이다. 조사일과 어긋나도 그대로 둔다 (3-12 #15)
      from: row.goodDcYn === "Y" && row.goodDcStartDay !== undefined ? ymdFromCompact(row.goodDcStartDay) : null,
      to: row.goodDcYn === "Y" && row.goodDcEndDay !== undefined ? ymdFromCompact(row.goodDcEndDay) : null,
    },
    sourceRegisteredAt: kstIso(row.inputDttm),
    flags,
  }
}
