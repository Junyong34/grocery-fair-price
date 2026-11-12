import { describe, expect, it } from "vitest"

import type { FoodEntry } from "./food-registry"
import { duplicateFoodIds, planFoodSync } from "./food-sync-plan"

const food = (over: Partial<FoodEntry> = {}): FoodEntry => ({
  name: "무",
  aliases: [],
  category: "채소",
  months: [10, 11],
  peak: [10],
  season: "verified",
  basis: "survey",
  evidence: { sources: ["https://example.com"] },
  ...over,
})
const reviewed = { review: "reviewed" } as const
const unreviewed = { review: "unreviewed" } as const

describe("planFoodSync", () => {
  it("제철 검증 품종과 이유식이 가리키는 그림을 웹 폴더 이름순으로 낸다", () => {
    const plan = planFoodSync({
      registry: { radish: food(), lemon: food({ name: "레몬", season: "unverified", basis: "foodnuri" }) },
      infantArtIds: ["tofu"],
      arts: { radish: reviewed, tofu: reviewed, lemon: reviewed },
      renamedIds: [],
    })

    expect(plan.problems).toEqual([])
    expect(plan.exports).toEqual([
      { webId: "radish", artId: "radish" },
      { webId: "tofu", artId: "tofu" },
    ])
  })

  it("품종 ID와 그림 ID가 다르면 품종 ID 폴더에 그 그림을 낸다", () => {
    const plan = planFoodSync({
      registry: { "fleshy-prawn": food({ name: "대하", art: "shrimp" }) },
      infantArtIds: ["shrimp"],
      arts: { shrimp: reviewed },
      renamedIds: [],
    })

    expect(plan.problems).toEqual([])
    expect(plan.exports).toEqual([
      { webId: "fleshy-prawn", artId: "shrimp" },
      { webId: "shrimp", artId: "shrimp" },
    ])
  })

  it("가리키는 그림의 원본이 없으면 어느 품종인지 알린다", () => {
    const plan = planFoodSync({ registry: { radish: food() }, infantArtIds: ["tofu"], arts: {}, renamedIds: [] })

    expect(plan.problems).toEqual([
      "품종 radish(무): 그림 원본이 없다(radish). 그림을 그리거나 품종 원본의 art를 고친다.",
      "이유식 그림 목록: 그림 원본이 없다(tofu). infant-art.json을 고치거나 그림을 그린다.",
    ])
  })

  it("미검수 그림을 가리키면 알린다", () => {
    const plan = planFoodSync({ registry: { radish: food() }, infantArtIds: [], arts: { radish: unreviewed }, renamedIds: [] })

    expect(plan.problems).toEqual(["품종 radish(무): 미검수 그림이다(radish). 그림 검수를 마치거나 품종을 제철 미검증으로 내린다."])
  })

  it("옛 품종 ID를 다시 쓰면 알린다", () => {
    const plan = planFoodSync({ registry: { grape: food({ name: "포도" }) }, infantArtIds: [], arts: { grape: reviewed }, renamedIds: ["grape"] })

    expect(plan.problems).toEqual(["품종 grape(포도): 옛 품종 ID다(renamed-foods.ts). 다른 ID를 쓴다."])
  })

  it("이유식 그림과 이름이 같은 폴더에 다른 그림을 내려는 품종을 알린다", () => {
    const plan = planFoodSync({
      registry: { tofu: food({ name: "두부콩", art: "soybean" }) },
      infantArtIds: ["tofu"],
      arts: { tofu: reviewed, soybean: reviewed },
      renamedIds: [],
    })

    expect(plan.problems).toEqual(["웹 폴더 tofu: 같은 이름의 품종은 다른 그림(soybean)을 쓰는데 이유식 그림 목록도 이 폴더에 그림을 내려 한다. 품종 ID나 art를 고친다."])
  })

  it("그림 원본이 없는 기기에서는 그림 검사를 건너뛴다", () => {
    const plan = planFoodSync({ registry: { radish: food() }, infantArtIds: ["tofu"], arts: null, renamedIds: [] })

    expect(plan.problems).toEqual([])
    expect(plan.exports).toEqual([])
  })

  it("근거가 빈 제철 검증 품종과 쓰이지 않는 검수 완료 그림은 오류가 아니라 알림이다", () => {
    const plan = planFoodSync({
      registry: { radish: food({ evidence: { sources: [] } }) },
      infantArtIds: [],
      arts: { radish: reviewed, lemon: reviewed, wasabi: unreviewed },
      renamedIds: [],
    })

    expect(plan.problems).toEqual([])
    expect(plan.notes).toEqual([
      "근거 출처가 빈 제철 검증 품종 1종",
      "검수는 마쳤지만 어느 화면도 쓰지 않아 내보내지 않는 그림 1개: lemon",
      "미검수 그림 1개: wasabi",
    ])
  })
})

describe("duplicateFoodIds", () => {
  it("품종 원본 글에서 두 번 나온 품종 ID를 찾는다", () => {
    const text = '{\n  "radish": {\n    "name": "무"\n  },\n  "lemon": {\n    "name": "레몬"\n  },\n  "radish": {\n    "name": "무2"\n  }\n}\n'

    expect(duplicateFoodIds(text)).toEqual(["radish"])
  })

  it("겹치지 않으면 빈 목록이다", () => {
    expect(duplicateFoodIds('{\n  "radish": {\n    "name": "무"\n  }\n}\n')).toEqual([])
  })
})
