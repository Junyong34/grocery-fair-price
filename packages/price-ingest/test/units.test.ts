import { describe, expect, it } from "vitest"

import { pricePerBase } from "../src/adapt/units.ts"

// 계산식: price_per_base = 원천 가격 ÷ (원천 수량을 기준 단위로 바꾼 값) × base_unit_qty (pipeline 3-1)
describe("기준 단위 가격 환산", () => {
  it("참가격 110g 1,500원은 100g당 1,363.64원이다 (pipeline 3-1 예)", () => {
    expect(pricePerBase(1500, 110, "G", { unit: "g", qty: 100 })).toBe(1363.64)
  })

  it("KAMIS 쌀 20kg 63,300원은 kg당 3,165원이다 (kamis.md 2-3)", () => {
    expect(pricePerBase(63300, 20, "kg", { unit: "kg", qty: 1 })).toBe(3165)
  })

  it("같은 개수 단위는 그대로 센다: 배추 1포기 8,110원은 1포기당 8,110원", () => {
    expect(pricePerBase(8110, 1, "포기", { unit: "포기", qty: 1 })).toBe(8110)
  })

  it("KAMIS 애호박 1개 1,830원은 1개당 1,830원이다 (pipeline 3-1 예)", () => {
    expect(pricePerBase(1830, 1, "개", { unit: "ea", qty: 1 })).toBe(1830)
  })

  it("축평원 원/100g 값은 기준이 100g이면 그대로다", () => {
    expect(pricePerBase(2985, 100, "g", { unit: "g", qty: 100 })).toBe(2985)
  })

  it("축평원 원/30구는 기준이 30개(계란)면 그대로다. 구와 개(ea)는 같은 개수다", () => {
    expect(pricePerBase(6000, 30, "구", { unit: "ea", qty: 30 })).toBe(6000)
  })

  it("무게와 부피는 서로 환산하지 않는다 (null)", () => {
    expect(pricePerBase(1000, 1, "ml", { unit: "g", qty: 100 })).toBeNull()
  })

  it("포기·마리·장은 1개다. 기준 단위 1개는 배추면 1포기, 생선이면 1마리 (variety-list.md 규칙 5)", () => {
    expect(pricePerBase(8110, 1, "포기", { unit: "ea", qty: 1 })).toBe(8110)
    expect(pricePerBase(12000, 10, "장", { unit: "ea", qty: 1 })).toBe(1200)
    expect(pricePerBase(5000, 1, "MR", { unit: "ea", qty: 1 })).toBe(5000)
  })

  it("손·단·망은 묶음이라 1개로 환산하지 않는다 (3-12 #10)", () => {
    expect(pricePerBase(9000, 1, "손", { unit: "ea", qty: 1 })).toBeNull()
    expect(pricePerBase(3000, 1, "DA", { unit: "g", qty: 100 })).toBeNull()
  })

  it("개수 단위 이름이 다르면 환산하지 않는다 (3-12 #10)", () => {
    expect(pricePerBase(1000, 1, "손", { unit: "g", qty: 100 })).toBeNull()
  })

  it("무게↔개수는 환산 기준(g_per_ea)이 있을 때만 한다", () => {
    expect(pricePerBase(1000, 600, "g", { unit: "ea", qty: 1, rule: { kind: "weight_to_ea", gPerEa: 300 } })).toBe(500)
    expect(pricePerBase(1000, 600, "g", { unit: "ea", qty: 1 })).toBeNull()
  })

  it("개수→무게: 2개 × 300g이면 100g당 166.67원이다", () => {
    expect(
      pricePerBase(1000, 2, "개", { unit: "g", qty: 100, rule: { kind: "ea_to_weight", gPerEa: 300 } }),
    ).toBe(166.67)
  })

  it("알 수 없는 단위(도매 묶음 등)는 null이다", () => {
    expect(pricePerBase(22600, 10, "kg(그물망 3포기)", { unit: "포기", qty: 1 })).toBeNull()
  })

  it("수량이 0 이하이면 null이다", () => {
    expect(pricePerBase(1000, 0, "g", { unit: "g", qty: 100 })).toBeNull()
  })
})
