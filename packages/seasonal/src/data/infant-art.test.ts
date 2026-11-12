import { describe, expect, it } from "vitest"

import { DRAWN_FOOD_IDS } from "./drawn-foods.generated"
import { FRUIT_ART_IDS, infantArtIds, PAIRING_ART_IDS } from "./infant-art"

describe("이유식 그림 목록", () => {
  it("가리키는 그림은 모두 웹에 나가 있다", () => {
    const drawn = new Set<string>(DRAWN_FOOD_IDS)

    expect(infantArtIds().filter((id) => !drawn.has(id))).toEqual([])
  })

  it("그림 ID를 겹치지 않게 모은다", () => {
    const ids = infantArtIds()

    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain(FRUIT_ART_IDS.mango)
    expect(ids).toContain(PAIRING_ART_IDS["두부"])
  })
})
