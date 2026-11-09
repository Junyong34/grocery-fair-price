import { describe, expect, it } from "vitest"

import { ADMIN_NAV, isActive } from "./admin-nav"

const item = (label: string) => ADMIN_NAV.flatMap((g) => g.items).find((i) => i.label === label)!

describe("어드민 메뉴의 지금 위치", () => {
  it("에디션은 목록과 편집 화면에서 켜지고 다른 화면에서는 꺼진다", () => {
    expect(isActive(item("에디션"), "/admin")).toBe(true)
    expect(isActive(item("에디션"), "/admin/edit")).toBe(true)
    expect(isActive(item("에디션"), "/admin/wireframes")).toBe(false)
  })

  it("하위 주소도 그 메뉴로 본다", () => {
    expect(isActive(item("와이어프레임"), "/admin/wireframes")).toBe(true)
    expect(isActive(item("이유식 궁합표"), "/admin/baby-food/print")).toBe(true)
    expect(isActive(item("이유식 궁합표"), "/admin")).toBe(false)
  })

  it("메뉴마다 주소가 겹치지 않는다", () => {
    const hrefs = ADMIN_NAV.flatMap((g) => g.items.map((i) => i.href))
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
