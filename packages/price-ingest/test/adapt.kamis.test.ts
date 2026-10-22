import { describe, expect, it } from "vitest"

import { RowRejectedError } from "../src/adapt/draft.ts"
import { adaptKamisRow, kamisRowRejection } from "../src/adapt/kamis.ts"
import { fixtureMapping, first, kamisBaechuRows } from "./fixtures/adapt.ts"

const ctx = { mapping: fixtureMapping }

describe("KAMIS 행 단위 거부 (pipeline 3-11)", () => {
  const row = first(kamisBaechuRows())
  const request = { seCd: "01", fromYmd: "20260928", toYmd: "20260928" } as const

  it("샘플 행은 거부하지 않는다", () => {
    expect(kamisRowRejection(row, request)).toBeNull()
  })

  it("가격이 양의 정수가 아니면 거부한다 (0, 음수)", () => {
    expect(kamisRowRejection({ ...row, exmn_dd_prc: "0" })).toBe("가격이 양의 정수가 아니다")
    expect(kamisRowRejection({ ...row, exmn_dd_prc: "-5" })).toBe("가격이 양의 정수가 아니다")
  })

  it("단위 크기가 0이면 거부한다", () => {
    expect(kamisRowRejection({ ...row, unit_sz: "0" })).toBe("단위 크기가 양의 정수가 아니다")
  })

  it("조사일이 요청 기간 밖이면 거부한다", () => {
    expect(kamisRowRejection({ ...row, exmn_ymd: "20260929" }, request)).toBe("조사일이 요청 기간 밖이다")
  })

  it("구분 코드가 요청과 다르면 거부한다", () => {
    expect(kamisRowRejection({ ...row, se_cd: "02" }, request)).toBe("구분 코드가 요청과 다르다")
  })

  it("축산이 아닌데 시장 코드나 등록 시각이 비면 거부한다 (null은 부류 500만)", () => {
    expect(kamisRowRejection({ ...row, mrkt_cd: null })).toBe("축산이 아닌데 시장 코드나 등록 시각이 비었다")
    expect(kamisRowRejection({ ...row, orgnl_reg_dt: null })).toBe("축산이 아닌데 시장 코드나 등록 시각이 비었다")
    expect(kamisRowRejection({ ...row, ctgry_cd: "500", mrkt_cd: null, mrkt_nm: null, orgnl_reg_dt: null })).toBeNull()
  })
})

describe("KAMIS 어댑터", () => {
  it("배추 샘플 행을 관측값 초안으로 바꾼다: 원천 키, 시장 코드, 날짜, 가격, 기준 단위 가격", () => {
    const draft = adaptKamisRow(first(kamisBaechuRows()), ctx)
    expect(draft).toMatchObject({
      recordKind: "observation",
      source: "kamis",
      sourceKey: "01-200-211-02-04",
      placeKey: "market:0110212",
      obsDate: "2026-09-28",
      priceTier: "retail",
      obsKind: "quote_sample",
      priceRaw: 8110,
      qtyRaw: 1,
      unitRaw: "포기",
      pricePerBase: 8110,
      varietyKey: "배추(여름·고랭지)",
      specKey: "상품",
      sourceRegisteredAt: "2026-09-28T15:06:40Z",
      flags: [],
    })
  })

  it("장소는 시장 이름이 아니라 시장 코드로 정한다 (pipeline 5장: 이름은 도시마다 겹친다)", () => {
    const row = first(kamisBaechuRows())
    const sameNameOtherCode = adaptKamisRow({ ...row, mrkt_cd: "0999999" }, ctx)
    expect(sameNameOtherCode.placeKey).toBe("market:0999999")
    expect(adaptKamisRow(row, ctx).placeKey).not.toBe(sameNameOtherCode.placeKey)
  })

  it("원천 품목 이름이 바뀌어도 원천 키는 같다 (3-12 #23: 같은 것은 코드로만 잇는다)", () => {
    const row = first(kamisBaechuRows())
    expect(adaptKamisRow({ ...row, item_nm: "다른 이름" }, ctx).sourceKey).toBe(adaptKamisRow(row, ctx).sourceKey)
  })

  it("등급명(grd_nm)이 바뀌어도 원천 키는 같다. 등급은 코드(grd_cd)로만 본다 (3-12 #3)", () => {
    const row = first(kamisBaechuRows())
    expect(adaptKamisRow({ ...row, grd_nm: "중품" }, ctx).sourceKey).toBe(adaptKamisRow(row, ctx).sourceKey)
  })

  it("환산가(exmn_dd_cnvs_prc)는 쓰지 않는다. 기준 단위 가격은 단위로 직접 계산한다 (3-12 #4)", () => {
    const row = first(kamisBaechuRows())
    const draft = adaptKamisRow({ ...row, exmn_dd_cnvs_prc: "999999" }, ctx)
    expect(draft.pricePerBase).toBe(8110)
  })

  it("작형(vrty_cd)이 다르면 원천 키가 다르다. 묶는 일은 매핑이 한다 (3-12 #9)", () => {
    const row = first(kamisBaechuRows())
    expect(adaptKamisRow({ ...row, vrty_cd: "03" }, ctx).sourceKey).not.toBe(adaptKamisRow(row, ctx).sourceKey)
  })

  it("처음 보는 품목 코드는 막지 않고, 매핑 없음으로 남긴다 (3-12 #5, #16)", () => {
    const draft = adaptKamisRow({ ...first(kamisBaechuRows()), item_cd: "999" }, ctx)
    expect(draft.varietyKey).toBeNull()
    expect(draft.specKey).toBeNull()
    expect(draft.pricePerBase).toBeNull()
  })

  it("단위를 기준 단위로 바꿀 수 없으면 기준 단위 가격은 null이고 경고는 붙지 않는다 (3-12 #10)", () => {
    const draft = adaptKamisRow({ ...first(kamisBaechuRows()), unit: "손" }, ctx)
    expect(draft.pricePerBase).toBeNull()
    expect(draft.flags).toEqual([])
  })

  it("도매(se_cd 02)는 받지 않는다 (MVP는 소매만, 3-12 #11)", () => {
    expect(() => adaptKamisRow({ ...first(kamisBaechuRows()), se_cd: "02" }, ctx)).toThrow("소매")
  })

  it("KAMIS 행에는 행사·판매처·제조사 정보가 없다 (3-11 null, 3-12 #7 #21)", () => {
    const draft = adaptKamisRow(first(kamisBaechuRows()), ctx)
    expect(draft.promo).toEqual({ discount: null, onePlusOne: null, from: null, to: null })
    expect(Object.keys(draft)).not.toContain("sellerKey")
    expect(Object.keys(draft)).not.toContain("makerCode")
  })

  it("원천 등록 시각만 바뀌면 가격은 같고 등록 시각만 다르다 (3-12 #24)", () => {
    const row = first(kamisBaechuRows())
    const later = adaptKamisRow({ ...row, orgnl_reg_dt: "2026-10-01T00:00:00Z" }, ctx)
    const base = adaptKamisRow(row, ctx)
    expect(later.priceRaw).toBe(base.priceRaw)
    expect(later.pricePerBase).toBe(base.pricePerBase)
    expect(later.sourceRegisteredAt).toBe("2026-10-01T00:00:00Z")
  })

  it("축산 행은 시장이 없어 지역 코드로 장소를 잡고, 집계값이며, 등록 시각이 없다", () => {
    const row = first(kamisBaechuRows())
    const livestock = adaptKamisRow(
      { ...row, ctgry_cd: "500", item_cd: "4301", mrkt_cd: null, mrkt_nm: null, sgg_cd: "1000", orgnl_reg_dt: null },
      { mapping: () => undefined },
    )
    expect(livestock.placeKey).toBe("region:1000")
    expect(livestock.obsKind).toBe("quote_aggregate")
    expect(livestock.sourceRegisteredAt).toBeNull()
  })

  it("가격이 0이면 관측값으로 넘기지 않는다 (3-11 행 단위 거부. DB도 price_raw > 0만 받는다)", () => {
    expect(() => adaptKamisRow({ ...first(kamisBaechuRows()), exmn_dd_prc: "0" }, ctx)).toThrow(RowRejectedError)
  })

  it("시장 유형은 어댑터가 정하지 않는다. 이름 규칙으로 못 가르는 시장도 코드로 장소를 잡는다 (3-12 #6)", () => {
    const draft = adaptKamisRow({ ...first(kamisBaechuRows()), mrkt_cd: "1000006", mrkt_nm: "가락소매" }, ctx)
    expect(draft.placeKey).toBe("market:1000006")
    expect(Object.keys(draft)).not.toContain("marketType")
  })

  it("같은 값이 여러 날 이어져도 어댑터는 이어 쓴 값을 표시하지 않는다. 판단은 ②가 한다 (3-12 #8)", () => {
    const row = first(kamisBaechuRows())
    const days = ["20260928", "20260929", "20260930"].map((exmn_ymd) => adaptKamisRow({ ...row, exmn_ymd }, ctx))
    expect(days.map((draft) => draft.priceRaw)).toEqual([8110, 8110, 8110])
    expect(days.every((draft) => draft.flags.length === 0)).toBe(true)
  })

  it("보존 기간이 지난 날짜의 재등록 행도 평범한 초안이다. 관측값에 넣을지는 적재가 정한다 (3-12 #25)", () => {
    const old = adaptKamisRow(
      { ...first(kamisBaechuRows()), exmn_ymd: "20210104", orgnl_reg_dt: "2026-10-21T00:00:00Z" },
      ctx,
    )
    expect(old.recordKind).toBe("observation")
    expect(old.obsDate).toBe("2021-01-04")
    expect(old.sourceRegisteredAt).toBe("2026-10-21T00:00:00Z")
  })
})
