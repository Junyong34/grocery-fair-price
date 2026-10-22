import { describe, expect, it } from "vitest"

import { chamgaPriceUrl, chamgaProductUrl, chamgaStandardUrl, chamgaStoreUrl } from "../src/sources/chamgagyeok.ts"
import { ekapeConsumerPriceUrl } from "../src/sources/ekape.ts"
import { kamisPerDayUrl } from "../src/sources/kamis.ts"
import { FAKE_KEY } from "./helpers.ts"

describe("KAMIS perDay 요청 주소", () => {
  const query = { fromYmd: "20260928", toYmd: "20260928", ctgryCd: "200", itemCd: "211", seCd: "01" } as const

  it("명세의 조건 키를 대괄호와 콜론까지 인코딩해 넣는다", () => {
    const url = kamisPerDayUrl(FAKE_KEY, query)
    expect(url.startsWith("https://apis.data.go.kr/B552845/perDay/price?")).toBe(true)
    expect(url).toContain("cond%5Bexmn_ymd%3A%3AGTE%5D=20260928")
    expect(url).toContain("cond%5Bexmn_ymd%3A%3ALTE%5D=20260928")
    expect(url).toContain("cond%5Bctgry_cd%3A%3AEQ%5D=200")
    expect(url).toContain("cond%5Bitem_cd%3A%3AEQ%5D=211")
    expect(url).toContain("cond%5Bse_cd%3A%3AEQ%5D=01")
  })

  it("returnType은 JSON, numOfRows는 1000으로 고정하고 pageNo는 기본 1이다", () => {
    const url = kamisPerDayUrl(FAKE_KEY, query)
    expect(url).toContain("returnType=JSON")
    expect(url).toContain("numOfRows=1000")
    expect(url).toContain("pageNo=1")
    expect(kamisPerDayUrl(FAKE_KEY, { ...query, pageNo: 2 })).toContain("pageNo=2")
  })

  it("인증키는 인코딩 없이 그대로 넣는다", () => {
    expect(kamisPerDayUrl(FAKE_KEY, query)).toContain(`serviceKey=${FAKE_KEY}&`)
  })

  it("날짜가 YYYYMMDD 8자리가 아니면 호출 전에 막는다", () => {
    expect(() => kamisPerDayUrl(FAKE_KEY, { ...query, fromYmd: "2026-09-28" })).toThrow("YYYYMMDD")
  })

  it("구분 코드는 01 또는 02만 받는다", () => {
    expect(() => kamisPerDayUrl(FAKE_KEY, { ...query, seCd: "07" as "01" })).toThrow("seCd")
  })

  it("인증키가 비어 있으면 막는다", () => {
    expect(() => kamisPerDayUrl("", query)).toThrow("인증키")
  })
})

describe("축평원 요청 주소", () => {
  it("명세의 http 주소를 그대로 쓴다 (https가 아니다)", () => {
    const url = ekapeConsumerPriceUrl(FAKE_KEY, { standYmd: "20261011", judgeKind: "4304" })
    expect(url.startsWith("http://data.ekape.or.kr/openapi-data/service/user/grade/consumerPriceDaily?")).toBe(true)
  })

  it("standYmd와 judgeKind를 넣는다", () => {
    const url = ekapeConsumerPriceUrl(FAKE_KEY, { standYmd: "20261011", judgeKind: "4304" })
    expect(url).toContain("standYmd=20261011")
    expect(url).toContain("judgeKind=4304")
  })

  it("itemCd는 줄 때만 넣는다", () => {
    expect(ekapeConsumerPriceUrl(FAKE_KEY, { standYmd: "20261011", judgeKind: "4304" })).not.toContain("itemCd")
    expect(ekapeConsumerPriceUrl(FAKE_KEY, { standYmd: "20261011", judgeKind: "4304", itemCd: "27" })).toContain(
      "itemCd=27",
    )
  })

  it("standYmd가 8자리 숫자가 아니면 막는다", () => {
    expect(() => ekapeConsumerPriceUrl(FAKE_KEY, { standYmd: "INVALID", judgeKind: "4304" })).toThrow("standYmd")
  })
})

describe("참가격 요청 주소", () => {
  it("가격 조회만 serviceKey를, 나머지 세 기능은 ServiceKey를 쓴다 (명세 불일치를 고정)", () => {
    expect(chamgaPriceUrl(FAKE_KEY, { goodInspectDay: "20260925", goodId: "1000" })).toContain(
      "/B551919/ProductPriceInfoService/getProductPriceInfoSvc?serviceKey=",
    )
    expect(chamgaStoreUrl(FAKE_KEY, {})).toContain("/getStoreInfoSvc.do?ServiceKey=")
    expect(chamgaProductUrl(FAKE_KEY, {})).toContain("/getProductInfoSvc.do?ServiceKey=")
    expect(chamgaStandardUrl(FAKE_KEY, { classCode: "AL" })).toContain("/getStandardInfoSvc.do?ServiceKey=")
  })

  it("가격 조회는 entpId나 goodId 중 하나가 있어야 한다", () => {
    expect(() => chamgaPriceUrl(FAKE_KEY, { goodInspectDay: "20260925" })).toThrow("entpId")
  })

  it("가격 조회의 조사일은 8자리 날짜다", () => {
    expect(() => chamgaPriceUrl(FAKE_KEY, { goodInspectDay: "2026-09-25", goodId: "1000" })).toThrow("goodInspectDay")
  })

  it("기준정보 classCode는 AL·UT·AR·BU만 받는다", () => {
    expect(chamgaStandardUrl(FAKE_KEY, { classCode: "UT" })).toContain("classCode=UT")
    expect(() => chamgaStandardUrl(FAKE_KEY, { classCode: "XX" })).toThrow("classCode")
  })
})
