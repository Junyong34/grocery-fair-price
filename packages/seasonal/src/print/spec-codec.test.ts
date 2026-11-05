import { describe, expect, it } from "vitest"

import { decodeSpecJson, encodeSpec } from "./spec-codec"

describe("spec-codec", () => {
  it("값을 base64url 한 줄로 바꾸고 그대로 되돌린다(한글 포함)", () => {
    const value = { kind: "month-poster", title: "달마다 제철 🍓" }
    // 사양 검증은 spec.ts의 몫이라 코덱은 모양을 따지지 않는다.
    const encoded = encodeSpec(value as never)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeSpecJson(encoded)).toEqual(value)
  })

  it("base64가 아니거나 JSON이 아니면 던진다", () => {
    expect(() => decodeSpecJson("!!!")).toThrow()
    expect(() => decodeSpecJson(encodeURIComponent("bm90IGpzb24"))).toThrow()
  })
})
