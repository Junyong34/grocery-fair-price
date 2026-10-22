import type { Mapping } from "../../src/adapt/mapping.ts"
import type { BaseUnit } from "../../src/adapt/units.ts"
import { parseChamgaPrice, parseChamgaProduct, type ChamgaPriceRow, type ChamgaProductRow } from "../../src/sources/chamgagyeok.ts"
import { parseEkapeConsumerPrice, type EkapeRow } from "../../src/sources/ekape.ts"
import { parseKamisPerDay, type KamisRow } from "../../src/sources/kamis.ts"
import { readSampleText } from "../helpers.ts"

// 테스트용 임시 매핑. 실제 품종 목록(p3-variety-catalog/01)과 원천 코드 표는 DB에 들어간다.
// 키 형식: "출처|원천 키" (원천 키는 pipeline 3-11의 source_item 키 모양이다)
const LINKS: Record<string, { varietyKey: string; specKey: string; base: BaseUnit }> = {
  "kamis|01-200-211-02-04": { varietyKey: "배추(여름·고랭지)", specKey: "상품", base: { unit: "포기", qty: 1 } },
  "ekape|4304-27-구분없음": { varietyKey: "국산 돼지 삼겹살", specKey: "구분없음", base: { unit: "g", qty: 100 } },
  "chamgagyeok|1000": { varietyKey: "라면", specKey: "기본", base: { unit: "g", qty: 100 } },
}

export const fixtureMapping: Mapping = (source, sourceKey) => LINKS[`${source}|${sourceKey}`]

export function first<T>(rows: readonly T[]): T {
  const row = rows[0]
  if (row === undefined) throw new Error("샘플 행이 없다")
  return row
}

export function kamisBaechuRows(): KamisRow[] {
  return parseKamisPerDay(200, readSampleText("kamis/vegetable-baechu-retail.json"))
}

export function ekapePorkRows(): EkapeRow[] {
  return parseEkapeConsumerPrice(200, readSampleText("ekape/pork-samgyeopsal.xml"))
}

export function chamgaPriceRows(): ChamgaPriceRow[] {
  return parseChamgaPrice(200, readSampleText("chamgagyeok/price-by-good-1000.xml"))
}

// 참가격 상품 1000의 용량 (product-1000.xml: 110 G)
export function chamgaProduct(goodId: string): Pick<ChamgaProductRow, "goodTotalCnt" | "goodTotalDivCode"> | undefined {
  if (goodId !== "1000") return undefined
  const [row] = parseChamgaProduct(200, readSampleText("chamgagyeok/product-1000.xml"))
  return row
}
