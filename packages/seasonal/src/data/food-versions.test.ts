import { describe, expect, it } from "vitest"

import { foodVersion, foodVersionsText } from "./food-versions"

const svgs = { color: "<svg>color</svg>", motion: "<svg>motion</svg>" }

describe("foodVersion", () => {
  it("color와 motion을 이은 글의 SHA-256 앞 8자다", async () => {
    // sha256("<svg>color</svg>\0<svg>motion</svg>")의 앞 8자
    expect(await foodVersion(svgs)).toBe("27ca44ce")
  })

  it("내용이 같으면 같은 값이다", async () => {
    expect(await foodVersion({ ...svgs })).toBe(await foodVersion(svgs))
  })

  it("color나 motion 어느 한쪽만 바뀌어도 값이 바뀐다", async () => {
    const base = await foodVersion(svgs)
    expect(await foodVersion({ ...svgs, color: "<svg>color2</svg>" })).not.toBe(base)
    expect(await foodVersion({ ...svgs, motion: "<svg>motion2</svg>" })).not.toBe(base)
  })

  it("두 파일의 경계가 옮겨 간 내용은 다른 값이다", async () => {
    expect(await foodVersion({ color: "ab", motion: "c" })).not.toBe(await foodVersion({ color: "a", motion: "bc" }))
  })
})

describe("foodVersionsText", () => {
  it("웹 폴더 이름순으로 FOOD_VERSIONS 표를 쓴다", () => {
    const text = foodVersionsText({ pear: "11111111", apple: "22222222" })

    expect(text).toContain("생성 파일. 직접 고치지 않는다.")
    expect(text).toContain(
      `export const FOOD_VERSIONS: Readonly<Record<string, string>> = {\n  "apple": "22222222",\n  "pear": "11111111",\n}\n`,
    )
  })
})
