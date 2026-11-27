import { expect, it } from "vitest"

import { foodArtSrc } from "./food-art"
import { FOOD_VERSIONS } from "./food-versions.generated"

it("내용 해시가 있는 그림 폴더는 주소에 ?v=를 붙인다", () => {
  expect(foodArtSrc("apple", "motion")).toBe(`/foods/apple/motion.svg?v=${FOOD_VERSIONS.apple}`)
  expect(foodArtSrc("apple")).toMatch(/^\/foods\/apple\/color\.svg\?v=[0-9a-f]{8}$/)
})

it("해시가 없는 폴더는 버전 없는 주소다", () => {
  expect(foodArtSrc("no-such-food")).toBe("/foods/no-such-food/color.svg")
})
