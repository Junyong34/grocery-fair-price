import { describe, expect, it } from "vitest"

import { RowRejectedError } from "../src/adapt/draft.ts"
import { adaptEkapeRow, ekapeRowRejection } from "../src/adapt/ekape.ts"
import type { Mapping } from "../src/adapt/mapping.ts"
import { ekapeConsumerPriceSchema, readEkapeConsumerPrice } from "../src/sources/ekape.ts"
import { checkWith } from "../src/validate.ts"
import { ekapePorkRows, fixtureMapping, first } from "./fixtures/adapt.ts"
import { readSampleText, renameKey } from "./helpers.ts"

const ctx = { mapping: fixtureMapping, requestedYmd: "20261011" }
const eggMapping: Mapping = () => ({ varietyKey: "계란", specKey: "일반란", base: { unit: "ea", qty: 30 } })

describe("축평원 어댑터", () => {
  it("당일 행은 전국 관측값이다: 가격, 원천 키, 날짜, 기준 단위 가격 (원/100g이면 그대로)", () => {
    const draft = adaptEkapeRow(first(ekapePorkRows()), ctx)
    expect(draft).toMatchObject({
      recordKind: "observation",
      source: "ekape",
      sourceKey: "4304-27-구분없음",
      placeKey: "national",
      obsDate: "2026-10-11",
      priceRaw: 2985,
      unitRaw: "원/100g",
      pricePerBase: 2985,
      varietyKey: "국산 돼지 삼겹살",
      specKey: "구분없음",
      flags: [],
    })
  })

  it("평년 행은 관측값이 아니라 평년 기준 값이다. 날짜는 요청한 기준일이다 (3-12 #2)", () => {
    const reference = ekapePorkRows()[1]
    expect(reference?.standYmd).toBe("평년")
    const draft = adaptEkapeRow(reference!, ctx)
    expect(draft).toMatchObject({
      recordKind: "reference",
      source: "ekape",
      refDate: "2026-10-11",
      priceRaw: 2721,
      placeKey: "national",
    })
    expect(Object.keys(draft)).not.toContain("obsDate")
  })

  it("처음 보는 등급·원산지 값은 매핑 없음으로 남긴다 (3-12 #1)", () => {
    const row = first(ekapePorkRows())
    const draft = adaptEkapeRow({ ...row, judgeKind: "4301", itemCd: "22", grdNm: "1+등급" }, ctx)
    expect(draft.sourceKey).toBe("4301-22-1+등급")
    expect(draft.varietyKey).toBeNull()
    expect(draft.pricePerBase).toBeNull()
  })

  it("단위가 예상과 다르면 기준 단위 가격은 null이고 단위 불일치 경고를 붙인다 (3-12 #12)", () => {
    const draft = adaptEkapeRow({ ...first(ekapePorkRows()), unit: "원/Kg" }, ctx)
    expect(draft.pricePerBase).toBeNull()
    expect(draft.flags).toEqual(["unit_mismatch"])
  })

  it("계란 원/30구는 기준 30개면 그대로다. 구는 개수 단위로 센다", () => {
    const row = first(ekapePorkRows())
    const egg = adaptEkapeRow(
      { ...row, judgeKind: "9903", itemCd: "10", grdNm: "일반란", judgeKindNm: "계란", unit: "원/30구", ntslPrc: "6000" },
      { mapping: eggMapping, requestedYmd: "20261011" },
    )
    expect(egg.unitRaw).toBe("원/30구")
    expect(egg.pricePerBase).toBe(6000)
  })

  it("축평원 행에는 행사·등록 시각이 없다", () => {
    const draft = adaptEkapeRow(first(ekapePorkRows()), ctx)
    if (draft.recordKind !== "observation") throw new Error("관측값이어야 한다")
    expect(draft.promo).toEqual({ discount: null, onePlusOne: null, from: null, to: null })
    expect(draft.sourceRegisteredAt).toBeNull()
  })

  it("가격이 0이면 관측값으로 넘기지 않는다 (3-11 행 단위 거부)", () => {
    const row = { ...first(ekapePorkRows()), ntslPrc: "0" }
    expect(ekapeRowRejection(row)).toBe("가격이 양의 정수가 아니다")
    expect(() => adaptEkapeRow(row, ctx)).toThrow(RowRejectedError)
  })

  it("축종 코드가 요청과 다르면 거부한다 (3-11)", () => {
    const row = first(ekapePorkRows())
    expect(ekapeRowRejection(row, { judgeKind: "4304" })).toBeNull()
    expect(ekapeRowRejection(row, { judgeKind: "4301" })).toBe("축종 코드가 요청과 다르다")
  })

  it("형식이 깨진 행(필드 이름이 바뀜)은 어댑터까지 오지 않는다. 계약 검사에서 막힌다 (3-12 #26)", () => {
    const raw = readEkapeConsumerPrice(200, readSampleText("ekape/pork-samgyeopsal.xml")) as {
      response: { body: { items: { item: Record<string, unknown>[] } } }
    }
    renameKey(raw.response.body.items.item, "ntslPrc", "ntslPrice")
    expect(checkWith(ekapeConsumerPriceSchema, raw).join("\n")).toContain("ntslPrc")
  })
})
