import { describe, expect, it } from "vitest"

import { explainVerdict, type VerdictSubject } from "./verdict-copy"

// 판정 풀이는 이 표 하나로 확인한다. 판정 묶음(보통 · 판정 전 · 오래됨 · 표본 적음 · 품종 · 브랜드 편차 · 평균 기준)마다
// 판정 카드 · 요약 문장 · 검색 설명에 나가는 모든 문장을 본다.

const kamis = { source: "KAMIS", scope: "전국 조사 시장" }

const PRICEY: VerdictSubject = {
  name: "녹두",
  baseUnit: "100g",
  price: 2700,
  usual: 2480,
  verdict: { kind: "pricey", pct: 9 },
  surveyedOn: "2026-11-03",
  sampleSize: 40,
  stale: false,
  meetsMinN: true,
  basis: kamis,
}

const NONE: VerdictSubject = { ...PRICEY, usual: null, verdict: { kind: "none", pct: null } }

describe("explainVerdict: 판정 카드", () => {
  it("판정 낱말, 최근 조사 기준 차이, 판정 근거를 쓴다", () => {
    const v = explainVerdict(PRICEY, null)
    expect(v.word).toBe("비싸요")
    expect(v.diffLine).toBe("최근 조사 결과를 보면 평소보다 9% 높아요")
    expect(v.basisLine).toBe("최근 조사 최대 세 건을 각각 그날의 평소가와 비교해요. 그 차이의 중간값으로 판정해요.")
    expect(v.notices).toEqual([])
  })

  it("싸요 · 평소와 같음", () => {
    expect(explainVerdict({ ...PRICEY, verdict: { kind: "cheap", pct: -12 } }, null).diffLine).toBe("최근 조사 결과를 보면 평소보다 12% 낮아요")
    expect(explainVerdict({ ...PRICEY, verdict: { kind: "normal", pct: 0 } }, null).diffLine).toBe("최근 조사 결과를 보면 평소와 같아요")
  })

  it("판정 전이면 평소가가 없다고 쓰고 판정 근거는 뺀다", () => {
    const v = explainVerdict(NONE, null)
    expect(v.word).toBe("판정 전")
    expect(v.diffLine).toBe("평소가가 없어 시세만 보여드려요")
    expect(v.basisLine).toBeNull()
  })
})

describe("explainVerdict: 판정 주의", () => {
  it("오래됨: 오늘을 모르면(정적 화면) 조사일만, 알면 얼마나 지났는지 쓴다", () => {
    const stale = { ...PRICEY, stale: true, surveyedOn: "2026-10-20" }
    expect(explainVerdict(stale, null).notices).toEqual([
      { kind: "stale", title: "마지막 조사 10/20", body: "최근 조사가 없어 지금과 다를 수 있어요" },
    ])
    expect(explainVerdict(stale, "2026-11-03").notices[0]!.title).toBe("마지막 조사 10/20 · 2주 전")
  })

  it("표본 적음: 판정이 있으면 판정은 참고로만, 판정 전이면 시세 이야기만", () => {
    expect(explainVerdict({ ...PRICEY, meetsMinN: false, sampleSize: 6 }, null).notices).toEqual([
      { kind: "fewSamples", title: "평소보다 적은 6곳 조사", body: "실제 시세와 다를 수 있어 판정은 참고로만 봐 주세요" },
    ])
    expect(explainVerdict({ ...NONE, meetsMinN: false, sampleSize: 6 }, null).notices[0]!.body).toBe("실제 시세와 다를 수 있어요")
  })

  it("표본 수를 모르면(meetsMinN null) 표본 적음으로 보지 않는다", () => {
    expect(explainVerdict({ ...PRICEY, meetsMinN: null }, null).notices).toEqual([])
  })

  it("품종 · 브랜드 편차: 판정은 흐름을 보는 참고라고 쓴다", () => {
    expect(explainVerdict({ ...PRICEY, name: "현미", priceSpread: "brand" }, null).notices).toEqual([
      { kind: "brandSpread", title: "현미는 품종 · 브랜드 · 도정일마다 값이 꽤 달라요", body: "판정은 현미값 흐름을 보는 참고로 봐 주세요" },
    ])
  })

  it("여럿이면 오래됨 · 표본 적음 · 품종 · 브랜드 편차 순서로 놓는다", () => {
    const all = { ...PRICEY, name: "쌀", stale: true, meetsMinN: false, priceSpread: "brand" as const }
    expect(explainVerdict(all, null).notices.map((n) => n.kind)).toEqual(["stale", "fewSamples", "brandSpread"])
  })
})

describe("explainVerdict: 요약 문장", () => {
  it("날짜(연도 포함)·출처·표본·시세·평소가·판정을 한 문장으로 쓴다", () => {
    expect(explainVerdict(PRICEY, null).summary).toBe(
      "2026년 11월 3일 KAMIS 전국 조사 시장 40곳 중간값 기준, 녹두 100g 시세는 2,700원이에요. 평소가는 2,480원이에요. 최근 조사 결과를 보면 평소보다 9% 높아 비싸요."
    )
  })

  it("싸요 · 같은 값", () => {
    expect(explainVerdict({ ...PRICEY, verdict: { kind: "cheap", pct: -12 } }, null).summary).toContain("평소보다 12% 낮아 싸요.")
    expect(explainVerdict({ ...PRICEY, verdict: { kind: "normal", pct: 0 } }, null).summary).toContain("평소와 같아 보통이에요.")
  })

  it("판정 전이면 평소가가 없다고 쓴다", () => {
    expect(explainVerdict(NONE, null).summary).toBe(
      "2026년 11월 3일 KAMIS 전국 조사 시장 40곳 중간값 기준, 녹두 100g 시세는 2,700원이에요. 평소가가 아직 쌓이지 않아 판정 전이에요."
    )
  })

  it("전국 평균(축평원)은 곳 수와 중간값을 쓰지 않는다", () => {
    const egg = { ...NONE, name: "계란", baseUnit: "30구", price: 6998, sampleSize: 1, basis: { source: "축평원", scope: "전국 평균" } }
    expect(explainVerdict(egg, null).summary).toMatch(/^2026년 11월 3일 축평원 전국 평균 기준, 계란 30구 시세는 6,998원이에요\./)
  })

  it("이름에 괄호가 있어도 단위를 괄호 밖에 써서 괄호가 겹치지 않는다", () => {
    const mackerel = { ...PRICEY, name: "고등어(국산)", baseUnit: "1개", price: 3990 }
    expect(explainVerdict(mackerel, null).summary).toContain("고등어(국산) 1개 시세는 3,990원이에요.")
  })
})

describe("explainVerdict: 검색 설명", () => {
  it("그날 시세와 판정을 넣어 검색 결과에서 바로 답이 보이게 한다", () => {
    expect(explainVerdict(PRICEY, null).seoDescription).toBe(
      "녹두(100g) 시세 2,700원, 평소보다 9% 높아 비싸요(11/3 KAMIS 조사). 대형마트·전통시장은 얼마에 파는지도 견줘 보세요."
    )
  })

  it("판정 전이면 평소가가 쌓이는 중이라고 쓴다", () => {
    expect(explainVerdict(NONE, null).seoDescription).toContain("평소가는 아직 쌓이는 중(11/3 KAMIS 조사)")
  })
})
