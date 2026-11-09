import { describe, expect, it } from "vitest"

import { productSub } from "./product-sub"

describe("productSub", () => {
  it("품목과 용량을 잇는다", () => {
    expect(
      productSub({ name: "불가리스 사과(4개)", item: "발효유", size: "600ml" })
    ).toBe("발효유 · 600ml")
  })

  it("이름에 이미 용량이 있으면 되풀이하지 않는다(띄어쓰기 · 대소문자 무시)", () => {
    expect(
      productSub({ name: "서울우유 흰우유(1L)", item: "우유", size: "1L" })
    ).toBe("우유")
    expect(
      productSub({ name: "너구리(5개입)", item: "라면", size: "5개" })
    ).toBe("라면")
    expect(
      productSub({ name: "생수 2 L", item: "생수", size: "2l" })
    ).toBe("생수")
  })

  it("용량이 없으면 품목만 보인다", () => {
    expect(productSub({ name: "양배추", item: "양배추", size: null })).toBe(
      "양배추"
    )
  })

  it("품목 제목 아래(hideItem)에서는 품목을 뺀다", () => {
    expect(
      productSub(
        { name: "달콤한 베지밀 비(16팩)", item: "두유", size: "3.04L" },
        true
      )
    ).toBe("3.04L")
    expect(
      productSub({ name: "식물성 마가린(200g)", item: "마가린", size: "200g" }, true)
    ).toBe("")
  })
})
