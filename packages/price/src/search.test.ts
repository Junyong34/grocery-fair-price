import { describe, expect, it } from "vitest"

import { searchVarieties } from "./search"
import type { SearchIndex } from "./types"

// 와이어프레임의 품종 일부. id는 이름으로 둔다.
const v = (name: string, item: string, category = "채소") => ({ id: name, name, item, category })
const INDEX: SearchIndex = {
  varieties: [
    v("배추", "배추"),
    v("알배기배추", "배추"),
    v("얼갈이배추", "배추"),
    v("양배추", "양배추"),
    v("애호박", "호박"),
    v("단호박", "호박"),
    v("쥬키니", "호박"),
    v("대파", "양념채소"),
    v("감귤", "감귤", "과일"),
    v("삼겹살(국산)", "돼지고기", "정육·계란"),
    v("한우 등심", "소고기", "정육·계란"),
    v("호주산 등심", "소고기", "정육·계란"),
    v("계란", "계란", "정육·계란"),
  ],
  aliases: [
    { text: "대패삼겹", varietyId: "삼겹살(국산)" },
    { text: "대패", varietyId: "삼겹살(국산)" },
    { text: "귤", varietyId: "감귤" },
    { text: "달걀", varietyId: "계란" },
    { text: "쇠고기", item: "소고기" },
  ],
  categories: ["채소", "과일", "정육·계란"],
}

const search = (q: string) => searchVarieties(INDEX, q)

describe("searchVarieties", () => {
  it("빈 검색어", () => {
    expect(search("")).toEqual({ kind: "empty" })
    expect(search("  ")).toEqual({ kind: "empty" })
  })

  it("이름 일부로 찾고, 이름이 검색어로 시작하는 품종을 앞에 둔다", () => {
    expect(search("배추")).toEqual({
      kind: "hits",
      ids: ["배추", "양배추", "알배기배추", "얼갈이배추"],
    })
  })

  it("초성으로 찾는다", () => {
    const r = search("ㅂㅊ")
    expect(r.kind).toBe("hits")
    expect(r.kind === "hits" && r.ids[0]).toBe("배추")
    expect(r.kind === "hits" && r.ids).toContain("양배추")
    expect(r.kind === "hits" && r.ids).not.toContain("대파")
  })

  it("띄어쓰기를 무시한다", () => {
    expect(search("한우등심")).toEqual({ kind: "hits", ids: ["한우 등심"] })
  })

  it("품목 이름이면 그 품목의 품종을 고르게 한다", () => {
    expect(search("호박")).toEqual({ kind: "item", item: "호박", ids: ["애호박", "단호박", "쥬키니"] })
    expect(search("소고기")).toEqual({ kind: "item", item: "소고기", ids: ["한우 등심", "호주산 등심"] })
  })

  it("품종이 하나뿐인 품목은 이름 검색과 같다", () => {
    expect(search("계란")).toEqual({ kind: "hits", ids: ["계란"] })
  })

  it("별칭이 품종을 가리키면 그 품종으로 찾았다고 알린다", () => {
    expect(search("대패삼겹")).toEqual({ kind: "alias", alias: "대패삼겹", ids: ["삼겹살(국산)"] })
    expect(search("달걀")).toEqual({ kind: "alias", alias: "달걀", ids: ["계란"] })
  })

  it("별칭이 품목을 가리키면 품목처럼 고르게 한다", () => {
    expect(search("쇠고기")).toEqual({ kind: "item", item: "소고기", ids: ["한우 등심", "호주산 등심"] })
  })

  it("별칭 일부로도 찾는다", () => {
    expect(search("대패삼")).toEqual({ kind: "hits", ids: ["삼겹살(국산)"] })
  })

  it("한 글자만 다르면 오타로 보고 제안한다", () => {
    expect(search("배츄")).toEqual({ kind: "typo", ids: ["배추"] })
    expect(search("대퍄")).toEqual({ kind: "typo", ids: ["대파"] })
  })

  it("한 글자 검색어는 오타로 제안하지 않는다", () => {
    expect(search("뷁")).toEqual({ kind: "none" })
  })

  it("맞는 품종이 없으면 none", () => {
    expect(search("트러플")).toEqual({ kind: "none" })
    expect(search("ㅌㄹㅍ")).toEqual({ kind: "none" })
  })
})
