import { describe, expect, it } from "vitest"

import { dishNames, findDish, isDishDrawn, TRADITIONAL_DISHES } from "./dishes"
import { DRAWN_DISH_IDS } from "./drawn-dishes.generated"
import { FESTIVALS } from "./festivals"

describe("TRADITIONAL_DISHES", () => {
  it("id가 겹치지 않는다", () => {
    const ids = TRADITIONAL_DISHES.map((dish) => dish.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("모든 명절의 전통 음식이 목록에 있다", () => {
    for (const festival of FESTIVALS) {
      for (const id of festival.traditionalDishes) expect(findDish(id), `${festival.slug}: ${id}`).toBeDefined()
    }
  })

  it("어느 명절에도 나오지 않는 음식은 두지 않는다", () => {
    const used = new Set<string>(FESTIVALS.flatMap((festival) => festival.traditionalDishes))
    expect(TRADITIONAL_DISHES.filter((dish) => !used.has(dish.id))).toEqual([])
  })
})

describe("isDishDrawn", () => {
  it("그림이 있는 음식은 모두 목록에 있다", () => {
    for (const id of DRAWN_DISH_IDS) expect(findDish(id), id).toBeDefined()
  })

  it("그림 목록에 있는 id만 true다", () => {
    expect(isDishDrawn("tteokguk")).toBe(DRAWN_DISH_IDS.includes("tteokguk" as never))
    expect(isDishDrawn("없는-음식")).toBe(false)
  })
})

describe("dishNames", () => {
  it("id 순서대로 이름을 돌려준다", () => {
    expect(dishNames(["tteokguk", "mandu"])).toEqual(["떡국", "만두"])
  })
})
