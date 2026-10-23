import { describe, expect, it } from "vitest"

import { findFood } from "./foods"
import { RENAMED_FOOD_IDS, renameFoodIds } from "./renamed-foods"

describe("renameFoodIds", () => {
  it("옛 id를 새 id로 바꾸고, 나머지는 그대로 둔다", () => {
    expect(renameFoodIds(["grape", "apple", "brown-croaker"])).toEqual(["green-grape", "apple", "croaker"])
  })

  it("바꾼 뒤 겹치는 id는 하나만 남긴다", () => {
    expect(renameFoodIds(["grape", "green-grape"])).toEqual(["green-grape"])
  })

  it("새 id는 모두 지금 있는 품종이다", () => {
    for (const id of Object.values(RENAMED_FOOD_IDS)) expect(findFood(id), id).toBeDefined()
  })
})
