import { describe, expect, it } from "vitest"

import { parseFoodContent } from "./food-content"
import { FOOD_CONTENT } from "./food-content.generated"
import { FOODS } from "./foods"

const persimmon = `## persimmon | 감

| 항목 | 내용 |
|---|---|
| **ID** | \`persimmon\` |
| **카테고리** | 과일 |
| **제철 / 절정** | 9~11월 / 10~11월(달력) |
| **대표 산지** | 상주·청도·영암 |
| **검증일** | 2026-11-12 |

> **한 줄 소개 (summary, 81자)**
> 감은 9~11월이 제철이에요. 단감은 꼭지가 붙어 있는 것을 고르세요.

### 1. 개요 및 특징
가을에 나는 감은 단감과 떫은감으로 나뉩니다.
홍시는 과육이 부드럽습니다.

### 2. 맛과 식감
단감은 아삭하고 은근히 달아요.

### 3. 고르는 방법
- 단감은 꼭지가 붙어 있는 것을 고르세요.
- 눌린 자국이 없는지 살피세요.

### 4. 보관 및 손질법
- **보관법** 단감은 물기를 없애 냉장하세요.
- **손질법** 흐르는 물에 씻으세요.

### 5. 추천 요리
- 단감 샐러드. 얇게 썰어 곁들입니다.

### 6. 품종과 유통 특성
부유의 수확 적기는 11월 상순입니다.

### 8. 출처 및 근거
- [농림수산식품교육문화정보원 · 제철농식품 ‘감’](https://www.foodnuri.go.kr/a) · 2026-11-12 확인
- [농촌진흥청 · 단감 적기 수확](https://www.rda.go.kr/b) · 2026-11-13 확인

**검수 메모** 화면에 나가지 않는 메모.

---
`

const header = `# fruit-01 · 담당 1

작성 완료 · 배정 2 / 작성 1 / 보류 1

## 목차 및 검수 현황
- [x] [감 (\`persimmon\`)](#persimmon--감)
- [ ] 괴도라치 (\`goedorachi\`) — 보류 이유. [기관 · 자료](https://example.com)

---

`

describe("parseFoodContent", () => {
  it("품종 블록에서 한 줄 소개·대표 산지·섹션·출처를 읽고 검수 메모는 버린다", () => {
    const content = parseFoodContent(header + persimmon)

    expect(Object.keys(content)).toEqual(["persimmon"])
    const food = content.persimmon!
    expect(food.summary).toBe("감은 9~11월이 제철이에요. 단감은 꼭지가 붙어 있는 것을 고르세요.")
    expect(food.origin).toBe("상주·청도·영암")
    expect(food.sections.map((section) => section.title)).toEqual([
      "개요 및 특징",
      "맛과 식감",
      "고르는 방법",
      "보관 및 손질법",
      "추천 요리",
      "품종과 유통 특성",
    ])
    expect(food.sources).toEqual([
      { org: "농림수산식품교육문화정보원", title: "제철농식품 ‘감’", url: "https://www.foodnuri.go.kr/a", checkedAt: "2026-11-12" },
      { org: "농촌진흥청", title: "단감 적기 수확", url: "https://www.rda.go.kr/b", checkedAt: "2026-11-13" },
    ])
    expect(JSON.stringify(food)).not.toContain("검수 메모")
  })

  it("문단 줄은 한 문단으로 잇고, 목록은 항목으로, 굵은 머리말은 라벨로 나눈다", () => {
    const { sections } = parseFoodContent(persimmon).persimmon!

    expect(sections[0]!.blocks).toEqual([{ kind: "paragraph", text: "가을에 나는 감은 단감과 떫은감으로 나뉩니다. 홍시는 과육이 부드럽습니다." }])
    expect(sections[2]!.blocks).toEqual([
      { kind: "list", items: [{ text: "단감은 꼭지가 붙어 있는 것을 고르세요." }, { text: "눌린 자국이 없는지 살피세요." }] },
    ])
    expect(sections[3]!.blocks).toEqual([
      {
        kind: "list",
        items: [
          { label: "보관법", text: "단감은 물기를 없애 냉장하세요." },
          { label: "손질법", text: "흐르는 물에 씻으세요." },
        ],
      },
    ])
  })

  it("내용이 —인 섹션과 대표 산지는 뺀다", () => {
    const thin = persimmon.replace("단감은 아삭하고 은근히 달아요.", "—").replace("상주·청도·영암", "—")
    const food = parseFoodContent(thin).persimmon!

    expect(food.sections.map((section) => section.title)).not.toContain("맛과 식감")
    expect(food.origin).toBeNull()
  })

  it("형식이 어긋나면 품종 ID를 담아 멈춘다", () => {
    expect(() => parseFoodContent(persimmon.replace("> **한 줄 소개 (summary, 81자)**\n", ""))).toThrow(/persimmon/)
    expect(() => parseFoodContent(persimmon.replace(/### 8\. 출처 및 근거\n- .*\n- .*\n/, "### 8. 출처 및 근거\n"))).toThrow(/persimmon/)
    expect(() => parseFoodContent(persimmon.replace("](https://www.rda.go.kr/b)", "]()"))).toThrow(/persimmon/)
    expect(() => parseFoodContent(persimmon + persimmon)).toThrow(/persimmon/)
  })
})

describe("FOOD_CONTENT", () => {
  it("제철 검증 품종은 보류한 괴도라치 말고 모두 원고가 있다", () => {
    expect(FOODS.filter((food) => !FOOD_CONTENT[food.id]).map((food) => food.id)).toEqual(["goedorachi"])
  })
})
