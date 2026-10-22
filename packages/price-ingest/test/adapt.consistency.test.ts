import { describe, expect, it } from "vitest"

import { adaptChamgaPriceRow } from "../src/adapt/chamga.ts"
import { adaptEkapeRow } from "../src/adapt/ekape.ts"
import { draftSchema, naturalKey, type Draft } from "../src/adapt/draft.ts"
import { adaptKamisRow } from "../src/adapt/kamis.ts"
import { chamgaPriceRows, chamgaProduct, ekapePorkRows, fixtureMapping, first, kamisBaechuRows } from "./fixtures/adapt.ts"

// 세 출처 공통 규칙: 스키마, 결정성, 중복 없음, 재수집 멱등, 이상치 표시

const ctx = { mapping: fixtureMapping, requestedYmd: "20261011", product: chamgaProduct }

const batches: { name: string; drafts: () => Draft[] }[] = [
  { name: "KAMIS 배추", drafts: () => kamisBaechuRows().map((row) => adaptKamisRow(row, ctx)) },
  {
    name: "축평원 삼겹살",
    drafts: () => ekapePorkRows().map((row) => adaptEkapeRow(row, ctx)),
  },
  { name: "참가격 상품 1000", drafts: () => chamgaPriceRows().map((row) => adaptChamgaPriceRow(row, ctx)) },
]

describe.each(batches)("$name 배치의 공통 규칙", ({ drafts }) => {
  it("모든 초안이 스키마를 만족한다", () => {
    for (const draft of drafts()) {
      expect(draftSchema.safeParse(draft).success, JSON.stringify(draft)).toBe(true)
    }
  })

  it("같은 입력을 두 번 바꾸면 같은 결과다 (결정성)", () => {
    expect(JSON.stringify(drafts())).toBe(JSON.stringify(drafts()))
  })

  it("한 배치 안에서 자연키가 겹치지 않는다", () => {
    const keys = drafts().map(naturalKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("같은 배치를 다시 받아 합쳐도 행 수가 늘지 않는다 (재수집 멱등)", () => {
    const once = new Map(drafts().map((draft) => [naturalKey(draft), draft]))
    const twice = new Map([...drafts(), ...drafts()].map((draft) => [naturalKey(draft), draft]))
    expect(twice.size).toBe(once.size)
  })

  it("기준 단위 가격은 값이 있으면 0 이상이고, 값이 없으면 매핑이 없을 때다", () => {
    for (const draft of drafts()) {
      if (draft.pricePerBase !== null) {
        expect(draft.pricePerBase).toBeGreaterThanOrEqual(0)
        expect(draft.varietyKey).not.toBeNull()
      }
    }
  })
})

describe("이상치 표시 (0, 음수, 비정상적으로 큰 값)", () => {
  const row = first(kamisBaechuRows())

  it("0이면 outlier", () => {
    expect(adaptKamisRow({ ...row, exmn_dd_prc: "0" }, ctx).flags).toEqual(["outlier"])
  })

  it("음수는 어댑터가 받아도 outlier로 표시한다 (형식 검사는 앞 단계가 막는다)", () => {
    expect(adaptKamisRow({ ...row, exmn_dd_prc: "-5" }, ctx).flags).toEqual(["outlier"])
  })

  it("임시 상한(1천만 원)을 넘으면 outlier", () => {
    expect(adaptKamisRow({ ...row, exmn_dd_prc: "10000001" }, ctx).flags).toEqual(["outlier"])
    expect(adaptKamisRow({ ...row, exmn_dd_prc: "9999999" }, ctx).flags).toEqual([])
  })
})

describe("출처가 달라도 같은 값은 둘 다 남긴다 (3-12 #22)", () => {
  it("KAMIS 축산과 축평원 같은 값은 출처 표시가 다른 초안 두 개가 된다", () => {
    const kamis = adaptKamisRow(
      { ...first(kamisBaechuRows()), ctgry_cd: "500", item_cd: "4301", mrkt_cd: null, mrkt_nm: null, sgg_cd: "1000", orgnl_reg_dt: null, unit: "100g" },
      { mapping: () => undefined },
    )
    const ekape = adaptEkapeRow(first(ekapePorkRows()), ctx)
    expect(kamis.source).not.toBe(ekape.source)
    expect(naturalKey(kamis)).not.toBe(naturalKey(ekape))
  })
})
