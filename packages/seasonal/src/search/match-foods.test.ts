import { describe, expect, it } from "vitest"

import { FOODS } from "../data/foods"
import { matchFoods } from "./match-foods"

const names = (query: string) => matchFoods(FOODS, query).map((food) => food.name)

describe("matchFoods", () => {
  it("이름 일부로 찾는다", () => {
    expect(names("전어")).toEqual(["전어"])
    expect(names("버섯")).toEqual(["가지버섯", "노루궁뎅이버섯", "목이버섯", "송이버섯", "표고버섯"])
  })

  it("초성으로 찾는다", () => {
    expect(names("ㅈㅇ")).toContain("전어")
    expect(names("ㅅㄱ")).toContain("사과")
    expect(names("ㅈㅇ")).not.toContain("사과")
  })

  it("다른 이름(별칭)으로도 찾는다", () => {
    expect(names("넙치")).toEqual(["광어"])
    expect(names("문치가자미")).toEqual(["봄 도다리"])
  })

  it("이름이 검색어로 시작하는 품종을 앞에 둔다", () => {
    // "자"가 든 품종: 감자·돼지감자·복분자·오미자·유자·자두, 별칭 문치가자미(봄 도다리). 가나다순이면 자두가 마지막이지만 맨 앞에 온다.
    expect(names("자")).toEqual(["자두", "감자", "돼지감자", "복분자", "봄 도다리", "오미자", "유자"])
  })
})
