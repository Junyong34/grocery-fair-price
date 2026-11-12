import { describe, expect, it } from "vitest"

import type { FoodEntry, FoodRegistry } from "@workspace/seasonal/data/food-registry"

import { createFood, editFood, infantKeys, linkArt, setInfantArt, type FoodEdit, type NewFood } from "./food-edit"

const radish: FoodEntry = { name: "무", aliases: [], category: "채소", months: [10, 11], peak: [10], season: "verified", basis: "survey", evidence: { sources: [] } }
const registry: FoodRegistry = { radish }
const input = (over: Partial<NewFood> = {}): NewFood => ({
  foodId: "lemon",
  artId: "lemon",
  name: "레몬",
  aliases: [],
  category: "과일",
  months: [12, 1],
  peak: [],
  sources: ["https://example.com/lemon"],
  checkedAt: "2026-11-12",
  ...over,
})

describe("createFood", () => {
  it("근거 출처와 확인일이 있으면 제철 검증된 품종으로 더한다", () => {
    const result = createFood(registry, input(), [])

    expect(result).toMatchObject({ ok: true, verified: true })
    expect(result.ok && result.registry.lemon).toEqual({
      name: "레몬",
      aliases: [],
      category: "과일",
      months: [1, 12],
      peak: [1, 12],
      season: "verified",
      basis: "survey",
      evidence: { sources: ["https://example.com/lemon"], checkedAt: "2026-11-12" },
    })
    expect(result.ok && result.registry.radish).toEqual(radish)
  })

  it("근거 출처나 확인일이 비면 제철 미검증으로 더한다", () => {
    const noSource = createFood(registry, input({ sources: [" "] }), [])
    const noDate = createFood(registry, input({ checkedAt: "" }), [])

    expect(noSource).toMatchObject({ ok: true, verified: false })
    expect(noSource.ok && noSource.registry.lemon).toMatchObject({ season: "unverified", basis: "user", evidence: { sources: [] } })
    expect(noDate.ok && noDate.registry.lemon).toMatchObject({ season: "unverified", evidence: { sources: ["https://example.com/lemon"] } })
  })

  it("품종 ID와 그림 ID가 다를 때만 그림 ID를 적는다", () => {
    const same = createFood(registry, input(), [])
    const other = createFood(registry, input({ foodId: "meyer-lemon", name: "마이어레몬" }), [])

    expect(same.ok && same.registry.lemon).not.toHaveProperty("art")
    expect(other.ok && other.registry["meyer-lemon"]?.art).toBe("lemon")
  })

  it("대표 달은 제철 달 안에서만 받는다", () => {
    expect(createFood(registry, input({ peak: [1] }), [])).toMatchObject({ ok: true })
    expect(createFood(registry, input({ peak: [7] }), [])).toEqual({ ok: false, error: "대표 달은 제철 달 가운데서 골라요." })
  })

  it("이미 있는 품종 ID, 옛 품종 ID, 형식이 틀린 ID, 겹치는 표시명을 막는다", () => {
    expect(createFood(registry, input({ foodId: "radish" }), [])).toEqual({ ok: false, error: "이미 있는 품종 ID예요: radish" })
    expect(createFood(registry, input({ foodId: "grape" }), ["grape"])).toEqual({ ok: false, error: "예전에 쓰던 품종 ID라 다시 쓸 수 없어요: grape" })
    expect(createFood(registry, input({ foodId: "Lemon 1" }), [])).toEqual({ ok: false, error: "품종 ID는 영문 소문자, 숫자, 하이픈만 써요." })
    expect(createFood(registry, input({ name: "무" }), [])).toEqual({ ok: false, error: "표시명이 다른 품종과 겹쳐요: 무 (radish)" })
  })

  it("제철 검증으로 저장하려면 제철 달이 있어야 한다", () => {
    expect(createFood(registry, input({ months: [] }), [])).toEqual({ ok: false, error: "제철 달을 하나 이상 골라요. 달을 모르면 근거를 비워 제철 미검증으로 저장해요." })
    expect(createFood(registry, input({ months: [], sources: [] }), [])).toMatchObject({ ok: true, verified: false })
  })

  it("이름과 별칭의 앞뒤 공백을 지우고 빈 별칭과 이름과 같은 별칭을 뺀다", () => {
    const result = createFood(registry, input({ name: " 레몬 ", aliases: ["", " 레몬", "lemon ", "lemon"] }), [])

    expect(result.ok && result.registry.lemon).toMatchObject({ name: "레몬", aliases: ["lemon"] })
  })
})

describe("linkArt", () => {
  it("기존 품종이 다른 그림을 쓰게 하고, 품종 ID와 같은 그림이면 art를 지운다", () => {
    const linked = linkArt(registry, "radish", "daikon")

    expect(linked.ok && linked.registry.radish?.art).toBe("daikon")
    expect(linked.ok && linkArt(linked.registry, "radish", "radish")).toMatchObject({ ok: true, registry: { radish } })
  })

  it("없는 품종이면 막는다", () => {
    expect(linkArt(registry, "lemon", "lemon")).toEqual({ ok: false, error: "없는 품종이에요: lemon" })
  })
})

describe("setInfantArt", () => {
  const art = { fruits: { mango: "mango" }, pairings: { 두부: "tofu" } }

  it("이유식 항목에 그림을 연결하거나 바꾼다", () => {
    expect(setInfantArt(art, "pairings", "레몬", "lemon")).toEqual({ fruits: { mango: "mango" }, pairings: { 두부: "tofu", 레몬: "lemon" } })
    expect(setInfantArt(art, "fruits", "mango", "apple-mango").fruits).toEqual({ mango: "apple-mango" })
  })

  it("그림 ID가 null이면 연결을 끊는다", () => {
    expect(setInfantArt(art, "pairings", "두부", null).pairings).toEqual({})
  })
})

describe("infantKeys", () => {
  it("궁합표에 나오는 재료 이름과 과일 도감의 과일 id · 주의 식재료 iconId를 낸다", () => {
    const keys = infantKeys()

    expect(keys.pairings).toContain("감자")
    expect(keys.pairings).toContain("브로콜리")
    expect(keys.pairings).not.toContain("브로콜리/콜리플라워")
    expect(keys.fruits).toContain("honey")
    expect(new Set(keys.pairings).size).toBe(keys.pairings.length)
  })
})

describe("editFood", () => {
  const base: FoodRegistry = {
    radish: { ...radish, evidence: { sources: ["https://old.example/radish"], market: "가을무" } },
    lemon: { name: "레몬", aliases: [], category: "과일", months: [12], peak: [12], season: "unverified", basis: "foodnuri", evidence: { sources: [] } },
  }
  const edit = (over: Partial<FoodEdit> = {}): FoodEdit => ({
    name: "무",
    aliases: [],
    category: "채소",
    months: [10, 11],
    peak: [10],
    season: "verified",
    art: "radish",
    newSources: [],
    checkedAt: "",
    reason: "",
    ...over,
  })

  it("표시명 · 별칭 · 카테고리는 근거 없이 고친다", () => {
    const result = editFood(base, "radish", edit({ name: "가을무", aliases: ["무", "조선무"], category: "채소" }))

    expect(result.ok && result.registry.radish).toMatchObject({ name: "가을무", aliases: ["무", "조선무"], evidence: { sources: ["https://old.example/radish"], market: "가을무" } })
  })

  it("제철 달을 바꾸면 새 근거 출처와 확인일이 있어야 한다", () => {
    expect(editFood(base, "radish", edit({ months: [10, 11, 12] }))).toEqual({ ok: false, error: "제철 달이나 대표 달을 바꾸려면 근거 출처와 확인일을 적어요." })
    expect(editFood(base, "radish", edit({ peak: [11] }))).toEqual({ ok: false, error: "제철 달이나 대표 달을 바꾸려면 근거 출처와 확인일을 적어요." })
  })

  it("새 근거는 앞에 더하고 이전 출처와 메모는 남긴다", () => {
    const result = editFood(base, "radish", edit({ months: [10, 11, 12], newSources: ["https://new.example"], checkedAt: "2026-11-12", reason: "월동무 수확기를 더한다" }))

    expect(result.ok && result.registry.radish).toMatchObject({
      months: [10, 11, 12],
      evidence: { sources: ["https://new.example", "https://old.example/radish"], checkedAt: "2026-11-12", reason: "월동무 수확기를 더한다", market: "가을무" },
    })
  })

  it("제철 미검증으로 내리면 달력에서 빠지고 근거는 남는다", () => {
    const result = editFood(base, "radish", edit({ season: "unverified" }))

    expect(result).toMatchObject({ ok: true, verified: false })
    expect(result.ok && result.registry.radish?.evidence.sources).toEqual(["https://old.example/radish"])
  })

  it("제철 검증으로 올리려면 근거 출처와 확인일이 있어야 한다", () => {
    const lemon = edit({ name: "레몬", category: "과일", months: [12], peak: [12], art: "lemon" })

    expect(editFood(base, "lemon", lemon)).toEqual({ ok: false, error: "제철 검증으로 올리려면 근거 출처와 확인일을 적어요." })
    expect(editFood(base, "lemon", { ...lemon, newSources: ["https://example.com"], checkedAt: "2026-11-12" })).toMatchObject({ ok: true, verified: true })
  })

  it("연결된 그림을 바꾸고, 품종 ID와 같으면 art를 지운다", () => {
    const linked = editFood(base, "radish", edit({ art: "daikon" }))

    expect(linked.ok && linked.registry.radish?.art).toBe("daikon")
    expect(linked.ok && editFood(linked.registry, "radish", edit()).ok && editFood(linked.registry, "radish", edit())).toMatchObject({ registry: { radish: expect.not.objectContaining({ art: expect.anything() }) } })
  })

  it("없는 품종, 겹치는 표시명, 달 밖의 대표 달을 막는다", () => {
    expect(editFood(base, "nope", edit())).toEqual({ ok: false, error: "없는 품종이에요: nope" })
    expect(editFood(base, "radish", edit({ name: "레몬" }))).toEqual({ ok: false, error: "표시명이 다른 품종과 겹쳐요: 레몬 (lemon)" })
    expect(editFood(base, "radish", edit({ peak: [3], newSources: ["a"], checkedAt: "2026-11-12" }))).toEqual({ ok: false, error: "대표 달은 제철 달 가운데서 골라요." })
  })

  it("다른 품종은 건드리지 않는다", () => {
    const result = editFood(base, "radish", edit({ name: "가을무" }))

    expect(result.ok && result.registry.lemon).toEqual(base.lemon)
  })
})
