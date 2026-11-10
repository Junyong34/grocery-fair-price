import { describe, expect, it } from "vitest"

import { PAIRINGS } from "../data/infant-pairings"
import { matchPairings } from "./match-pairings"

const bases = (query: string) => matchPairings(PAIRINGS, query).bases.map((row) => row.name)
const mentions = (query: string) => matchPairings(PAIRINGS, query).mentions

describe("matchPairings", () => {
  it("빈 검색어면 기준 재료를 모두 돌려주고 언급은 없다", () => {
    expect(bases("  ")).toHaveLength(PAIRINGS.length)
    expect(mentions("")).toEqual([])
  })

  it("이름 일부와 띄어쓰기 무시로 기준 재료를 찾는다", () => {
    expect(bases("고구마")).toEqual(["고구마"])
    expect(bases("단 호박")).toEqual(["단호박"])
  })

  it("초성으로 찾는다", () => {
    expect(bases("ㄱㄱㅁ")).toContain("고구마")
    expect(bases("ㄱㄱㅁ")).not.toContain("감자")
  })

  it("별칭으로 찾는다(달걀 → 계란)", () => {
    expect(bases("달걀")).toEqual(["계란"])
  })

  it("'/'로 묶인 기준 재료는 각 이름으로 찾는다", () => {
    expect(bases("콜리플라워")).toEqual(["브로콜리/콜리플라워"])
  })

  it("이름이 검색어로 시작하는 기준 재료를 앞에 둔다", () => {
    const result = bases("소")
    expect(result[0]).toBe("소고기")
  })

  it("기준 재료가 아닌 재료는 어느 표의 O·X에 있는지 돌려준다", () => {
    expect(bases("땅콩")).toEqual([])
    const [peanut, ...rest] = mentions("땅콩")
    expect(rest).toEqual([])
    expect(peanut?.item).toBe("땅콩")
    expect(peanut?.in.map(({ row, sign }) => `${row.name}:${sign}`)).toContain("고구마:X")
    expect(peanut?.in.every(({ sign }) => sign === "X")).toBe(true)
  })

  it("초성 검색의 언급은 앞부분이 맞는 재료만 낸다", () => {
    expect(mentions("ㄴㄹㅈ").map(({ item }) => item)).not.toContain("달걀노른자")
    expect(mentions("ㄸㅋ").map(({ item }) => item)).toEqual(["땅콩"])
  })

  it("기준 재료로 찾힌 이름은 언급으로 다시 내지 않는다", () => {
    expect(mentions("고구마")).toEqual([])
  })

  it("맞는 것이 없으면 둘 다 비어 있다", () => {
    expect(matchPairings(PAIRINGS, "초콜릿")).toEqual({ bases: [], mentions: [] })
  })
})
