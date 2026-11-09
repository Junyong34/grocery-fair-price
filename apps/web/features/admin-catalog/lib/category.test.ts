import { describe, expect, it } from "vitest"

import { moveOrder, parseCategoryInput, renumber } from "./category"

describe("카테고리 입력 검사", () => {
  it("slug는 소문자·숫자·하이픈, 이름은 1~20자이고 앞뒤 공백을 지운다", () => {
    expect(parseCategoryInput({ slug: " ramen-noodle ", name: " 라면·면 " })).toEqual({ ok: true, value: { slug: "ramen-noodle", name: "라면·면" } })
    expect(parseCategoryInput({ slug: "Ramen", name: "라면" })).toMatchObject({ ok: false })
    expect(parseCategoryInput({ slug: "ramen", name: "" })).toMatchObject({ ok: false })
    expect(parseCategoryInput({ slug: "ramen", name: "가".repeat(21) })).toMatchObject({ ok: false })
  })
})

const rows = [
  { id: 1, sort: 1 },
  { id: 2, sort: 2 },
  { id: 3, sort: 3 },
]

describe("순서", () => {
  it("위·아래로 옮기면 이웃과 자리를 바꾸고, 끝에서는 그대로다", () => {
    expect(moveOrder(rows, 2, "up")).toEqual([{ id: 2, sort: 1 }, { id: 1, sort: 2 }])
    expect(moveOrder(rows, 2, "down")).toEqual([{ id: 2, sort: 3 }, { id: 3, sort: 2 }])
    expect(moveOrder(rows, 1, "up")).toEqual([])
    expect(moveOrder(rows, 3, "down")).toEqual([])
  })

  it("보정: 비었거나 겹친 순서를 지금 보이는 순서대로 1부터 다시 매기고, 바뀐 행만 돌려준다", () => {
    expect(renumber([{ id: 5, sort: null }, { id: 1, sort: 2 }, { id: 2, sort: 2 }])).toEqual([
      { id: 5, sort: 1 },
      { id: 2, sort: 3 },
    ])
    expect(renumber(rows)).toEqual([])
  })
})
