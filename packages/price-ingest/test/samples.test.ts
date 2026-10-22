import { describe, expect, it } from "vitest"

import { checkWith } from "../src/validate.ts"
import { chamgaPriceSchema, chamgaProductSchema, chamgaStandardSchema, chamgaStoreSchema, readChamgaPrice, readChamgaProduct, readChamgaStandard, readChamgaStore } from "../src/sources/chamgagyeok.ts"
import { ekapeConsumerPriceSchema, readEkapeConsumerPrice } from "../src/sources/ekape.ts"
import { kamisPerDaySchema, readKamisPerDay } from "../src/sources/kamis.ts"
import { readSampleText, renameKey } from "./helpers.ts"

// 저장 샘플(성공 응답)은 모두 계약 스키마를 만족해야 한다.
// *.excerpt.xml은 잘린 발췌본이라 제외한다.

const KAMIS_OK_SAMPLES = [
  "kamis/vegetable-baechu-retail.json",
  "kamis/vegetable-baechu-retail-14d.json",
  "kamis/vegetable-aehobak-retail.json",
  "kamis/vegetable-baechu-wholesale.json",
  "kamis/fruit-sagwa-retail.json",
  "kamis/fish-godeungeo-retail.json",
  "kamis/missing-date-from.json",
  "kamis/empty-future-dates.json",
  "kamis/empty-missing-item.json",
]

const EKAPE_OK_SAMPLES = [
  "ekape/pork-samgyeopsal.xml",
  "ekape/pork-all-items.xml",
  "ekape/pork-import-samgyeopsal.xml",
  "ekape/beef-all-items.xml",
  "ekape/beef-deungsim.xml",
  "ekape/beef-import-all-items.xml",
  "ekape/chicken-all-items.xml",
  "ekape/egg-all-items.xml",
  "ekape/milk-all-items.xml",
]

describe.each(KAMIS_OK_SAMPLES)("KAMIS 샘플 계약: %s", (path) => {
  it("계약 스키마를 만족한다", () => {
    expect(checkWith(kamisPerDaySchema, readKamisPerDay(200, readSampleText(path)))).toEqual([])
  })
})

describe.each(EKAPE_OK_SAMPLES)("축평원 샘플 계약: %s", (path) => {
  it("계약 스키마를 만족한다", () => {
    expect(checkWith(ekapeConsumerPriceSchema, readEkapeConsumerPrice(200, readSampleText(path)))).toEqual([])
  })
})

const CHAMGA_SAMPLES = [
  { path: "chamgagyeok/price-by-good-1000.xml", read: readChamgaPrice, schema: chamgaPriceSchema },
  { path: "chamgagyeok/price-by-entp-100.xml", read: readChamgaPrice, schema: chamgaPriceSchema },
  { path: "chamgagyeok/price-non-survey-day.xml", read: readChamgaPrice, schema: chamgaPriceSchema },
  { path: "chamgagyeok/product-1000.xml", read: readChamgaProduct, schema: chamgaProductSchema },
  { path: "chamgagyeok/product-all.xml", read: readChamgaProduct, schema: chamgaProductSchema },
  { path: "chamgagyeok/store-100.xml", read: readChamgaStore, schema: chamgaStoreSchema },
  { path: "chamgagyeok/store-all.xml", read: readChamgaStore, schema: chamgaStoreSchema },
  { path: "chamgagyeok/standard-AL.xml", read: readChamgaStandard, schema: chamgaStandardSchema },
  { path: "chamgagyeok/standard-AR.xml", read: readChamgaStandard, schema: chamgaStandardSchema },
  { path: "chamgagyeok/standard-BU.xml", read: readChamgaStandard, schema: chamgaStandardSchema },
  { path: "chamgagyeok/standard-UT.xml", read: readChamgaStandard, schema: chamgaStandardSchema },
]

describe.each(CHAMGA_SAMPLES)("참가격 샘플 계약: $path", ({ path, read, schema }) => {
  it("계약 스키마를 만족한다", () => {
    expect(checkWith(schema, read(200, readSampleText(path)))).toEqual([])
  })
})

describe("필드 이름이 바뀌면 계약 검사가 실패하고 바뀐 필드 이름을 보여준다", () => {
  it("KAMIS: exmn_dd_prc를 exmn_dd_price로 바꾸면 두 이름이 모두 보인다", () => {
    const raw = readKamisPerDay(200, readSampleText("kamis/vegetable-baechu-retail.json")) as {
      response: { body: { items: { item: Record<string, unknown>[] } } }
    }
    renameKey(raw.response.body.items.item, "exmn_dd_prc", "exmn_dd_price")
    const issues = checkWith(kamisPerDaySchema, raw).join("\n")
    expect(issues).toContain("exmn_dd_prc")
    expect(issues).toContain("exmn_dd_price")
  })

  it("축평원: ntslPrc를 ntslPrice로 바꾸면 그 필드 이름이 보인다", () => {
    const raw = readEkapeConsumerPrice(200, readSampleText("ekape/pork-samgyeopsal.xml")) as {
      response: { body: { items: { item: Record<string, unknown>[] } } }
    }
    renameKey(raw.response.body.items.item, "ntslPrc", "ntslPrice")
    expect(checkWith(ekapeConsumerPriceSchema, raw).join("\n")).toContain("ntslPrc")
  })

  it("참가격: goodPrice를 바꾸면 그 필드 이름이 보인다 (goodPriceVO 안)", () => {
    const raw = readChamgaPrice(200, readSampleText("chamgagyeok/price-by-good-1000.xml")) as {
      response: { result: Record<string, Record<string, unknown>[]> }
    }
    renameKey(raw.response.result["iros.openapi.service.vo.goodPriceVO"] ?? [], "goodPrice", "goodPriceWon")
    expect(checkWith(chamgaPriceSchema, raw).join("\n")).toContain("goodPrice")
  })
})
