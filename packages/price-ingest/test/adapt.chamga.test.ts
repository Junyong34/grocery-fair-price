import { describe, expect, it } from "vitest"

import { adaptChamgaPriceRow, chamgaPriceRowRejection } from "../src/adapt/chamga.ts"
import { RowRejectedError } from "../src/adapt/draft.ts"
import { chamgaPriceRows, chamgaProduct, fixtureMapping, first } from "./fixtures/adapt.ts"

const ctx = { mapping: fixtureMapping, product: chamgaProduct }

describe("참가격 어댑터", () => {
  it("첫 가격 행을 진열가 관측값으로 바꾼다: 상품 키, 점포 키, 기준 단위 가격(상품 용량 기준), 등록 시각(KST)", () => {
    const draft = adaptChamgaPriceRow(first(chamgaPriceRows()), ctx)
    expect(draft).toMatchObject({
      recordKind: "observation",
      source: "chamgagyeok",
      sourceKey: "1000",
      placeKey: "store:887",
      obsDate: "2026-09-25",
      priceTier: "retail",
      obsKind: "shelf_price",
      priceRaw: 1280,
      qtyRaw: null,
      unitRaw: null,
      pricePerBase: 1163.64,
      varietyKey: "라면",
      specKey: "기본",
      sourceRegisteredAt: "2026-09-23T12:00:10+09:00",
      flags: [],
    })
  })

  it("점포 키는 entpId다. 재등록 사슬은 DB에서 잇는다 (3-12 #18)", () => {
    const row = first(chamgaPriceRows())
    expect(adaptChamgaPriceRow({ ...row, entpId: "100" }, ctx).placeKey).toBe("store:100")
  })

  it("1+1 행사 행은 단위를 검증하기 전까지 기준 단위 가격을 비우고 표시한다 (3-12 #13)", () => {
    const draft = adaptChamgaPriceRow({ ...first(chamgaPriceRows()), plusoneYn: "Y" }, ctx)
    expect(draft.pricePerBase).toBeNull()
    expect(draft.flags).toEqual(["one_plus_one_unverified"])
    expect(draft.promo.onePlusOne).toBe(true)
  })

  it("행사 필드가 없으면 false가 아니라 null이다 (모름, 3-12 #14)", () => {
    const row = first(chamgaPriceRows())
    expect(row.goodDcYn).toBeUndefined()
    expect(adaptChamgaPriceRow(row, ctx).promo.discount).toBeNull()
  })

  it("행사 기간이 조사일과 어긋나도 행사 여부는 goodDcYn을 따르고, 기간은 그대로 둔다 (3-12 #15)", () => {
    const draft = adaptChamgaPriceRow(
      { ...first(chamgaPriceRows()), goodDcYn: "Y", goodDcStartDay: "20260901", goodDcEndDay: "20260907" },
      ctx,
    )
    expect(draft.promo).toEqual({ discount: true, onePlusOne: null, from: "2026-09-01", to: "2026-09-07" })
  })

  it("상품 용량을 모르면 기준 단위 가격은 null이다 (3-11: 상품 속성으로 환산)", () => {
    const draft = adaptChamgaPriceRow(first(chamgaPriceRows()), { mapping: fixtureMapping, product: () => undefined })
    expect(draft.pricePerBase).toBeNull()
  })

  it("매핑이 없는 상품은 품종 없음으로 남긴다 (3-12 #16)", () => {
    const draft = adaptChamgaPriceRow({ ...first(chamgaPriceRows()), goodId: "9999" }, ctx)
    expect(draft.varietyKey).toBeNull()
    expect(draft.pricePerBase).toBeNull()
  })

  it("원천 키는 goodId 그대로다. goodId 재사용이 의심되는 일은 DB 쪽 product_source_key에서 한다 (3-12 #17)", () => {
    expect(adaptChamgaPriceRow(first(chamgaPriceRows()), ctx).sourceKey).toBe("1000")
  })

  it("상품 제조사 코드와 점포 지역 코드는 관측값에 넣지 않는다 (3-12 #20 #21)", () => {
    const draft = adaptChamgaPriceRow(first(chamgaPriceRows()), ctx)
    expect(Object.keys(draft)).not.toContain("makerCode")
    expect(Object.keys(draft)).not.toContain("regionCode")
  })

  it("가격이 0이면 관측값으로 넘기지 않는다 (3-11 행 단위 거부)", () => {
    const row = { ...first(chamgaPriceRows()), goodPrice: "0" }
    expect(chamgaPriceRowRejection(row)).toBe("가격이 양의 정수가 아니다")
    expect(() => adaptChamgaPriceRow(row, ctx)).toThrow(RowRejectedError)
    expect(chamgaPriceRowRejection(first(chamgaPriceRows()))).toBeNull()
  })

  it("편의점 본사 가격의 지역 범위는 어댑터가 정하지 않는다. 범위는 점포 표에서 정한다 (3-12 #19)", () => {
    const draft = adaptChamgaPriceRow(first(chamgaPriceRows()), ctx)
    expect(Object.keys(draft)).not.toContain("regionScope")
  })
})
