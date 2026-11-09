import { describe, expect, it } from "vitest"

import {
  findPairing,
  isPairingIndexable,
  pairingMentions,
  pairingRelationCount,
  PAIRINGS,
  type PairingRow,
} from "./infant-pairings"

const row = (name: string): PairingRow => {
  const found = PAIRINGS.find((pairing) => pairing.name === name)
  if (!found) throw new Error(name)
  return found
}

describe("infant-pairings", () => {
  it("id는 모두 다르고 영문 소문자·숫자·하이픈이다", () => {
    const ids = PAIRINGS.map((pairing) => pairing.id)
    expect(new Set(ids).size).toBe(PAIRINGS.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it("31개 기준 재료가 있고, 브로콜리/콜리플라워는 broccoli다", () => {
    expect(PAIRINGS).toHaveLength(31)
    expect(row("브로콜리/콜리플라워").id).toBe("broccoli")
    expect(row("소고기").id).toBe("beef")
    expect(findPairing("sweet-potato")?.name).toBe("고구마")
    expect(findPairing("nope")).toBeUndefined()
  })

  it("pairingMentions는 다른 기준 재료 표에서 그 재료가 나온 곳을 방향과 함께 돌려준다", () => {
    expect(pairingMentions("소고기")).toEqual([{ base: "고구마", sign: "X" }])
    expect(pairingMentions("연어")).toEqual([{ base: "멸치", sign: "O" }])
    // 우유 표에서 고구마는 O와 X 양쪽에 있다.
    expect(pairingMentions("고구마")).toContainEqual({
      base: "우유",
      sign: "O",
    })
    expect(pairingMentions("고구마")).toContainEqual({
      base: "우유",
      sign: "X",
    })
  })

  it("pairingMentions는 자기 표를 세지 않고, 이름이 /로 묶인 재료는 각 이름으로 찾는다", () => {
    expect(pairingMentions("감자").map(({ base }) => base)).not.toContain(
      "감자"
    )
    const broccoli = pairingMentions("브로콜리/콜리플라워").map(
      ({ base }) => base
    )
    expect(broccoli).toContain("고구마")
    expect(broccoli).toContain("소고기")
    const crab = pairingMentions("게살").map(({ base }) => base)
    expect(crab).toContain("양배추")
    expect(crab).toContain("브로콜리/콜리플라워")
  })

  it("matchesSelectedIngredient는 /로 묶인 이름과 게살·게 별칭을 함께 맞춘다", async () => {
    const { matchesSelectedIngredient } = await import("./infant-pairings")
    expect(
      matchesSelectedIngredient("브로콜리", ["브로콜리/콜리플라워"])
    ).toBe(true)
    expect(matchesSelectedIngredient("게", ["게살"])).toBe(true)
    expect(matchesSelectedIngredient("감자", ["고구마"])).toBe(false)
  })

  it("explainInfantPairing은 충돌·통념 X·영양 보완 O와 이유식 주의사항을 돌려준다", async () => {
    const { explainInfantPairing } = await import("./infant-pairings")
    expect(explainInfantPairing("우유", "고구마", "X").kind).toBe("conflict")
    expect(explainInfantPairing("당근", "오이", "X").kind).toBe("myth-enzyme")
    expect(explainInfantPairing("두부", "시금치", "X").kind).toBe("myth-oxalate")
    expect(explainInfantPairing("소고기", "고구마", "X").kind).toBe("myth-digestion")
    const walnut = explainInfantPairing("양배추", "호두", "O")
    expect(walnut.cautions.length).toBeGreaterThan(0)
  })

  it("돼지고기 O 목록에는 고염 발효식품인 새우젓을 넣지 않는다", () => {
    expect(row("돼지고기").good).not.toContain("새우젓")
  })

  it("pairingRelationCount는 O + X + 역참조 수다", () => {
    expect(pairingRelationCount(row("배추"))).toBe(1)
    expect(pairingRelationCount(row("조개"))).toBe(3)
    expect(pairingRelationCount(row("콩"))).toBe(4)
    const beef = row("소고기")
    expect(pairingRelationCount(beef)).toBe(
      beef.good.length + beef.bad.length + 1
    )
  })

  it("isPairingIndexable은 관계 수 5 이상이거나 사람이 쓴 본문이 있으면 true다", () => {
    for (const name of ["배추", "우엉", "블루베리", "조개", "연어", "콩"])
      expect(isPairingIndexable(row(name), { hasCopy: false }), name).toBe(
        false
      )
    for (const name of ["소고기", "고구마"])
      expect(isPairingIndexable(row(name), { hasCopy: false }), name).toBe(true)
    expect(isPairingIndexable(row("연어"), { hasCopy: true })).toBe(true)
    expect(
      PAIRINGS.filter(
        (pairing) => !isPairingIndexable(pairing, { hasCopy: false })
      )
    ).toHaveLength(6)
  })
})
