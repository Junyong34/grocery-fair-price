// 식재료 목록 어드민의 화면 모양 (catalog-scale/07의 읽기 화면). DB 행을 화면 상태·요약·제철 연결로 바꾸는 순수 함수.
import type { VerdictKind } from "@workspace/price/types"

export type VarietyRow = {
  slug: string
  name: string
  status: "active" | "hidden"
  category: string
  item: string
  specs: number
  keys: { kamis: number; ekape: number; chamga: number }
  seasonal: readonly string[] // 제철 품종 id
  // 지금 공개된 판정 묶음의 행. 없으면 화면에 나오지 않는다 (전국 소매 시세가 한 번도 없다)
  judgment: { verdict: VerdictKind; pct: number | null; surveyedOn: string } | null
}

export type ScreenState = "shown" | "before-verdict" | "no-quote" | "hidden"

export const SCREEN_STATE_LABEL: Record<ScreenState, string> = {
  shown: "노출 · 판정",
  "before-verdict": "노출 · 판정 전",
  "no-quote": "미노출 · 시세 없음",
  hidden: "미노출 · 숨김",
}

export function screenStateOf(v: VarietyRow): ScreenState {
  if (v.status === "hidden") return "hidden"
  if (v.judgment === null) return "no-quote"
  return v.judgment.verdict === "none" ? "before-verdict" : "shown"
}

export type Summary = { total: number; shown: number; beforeVerdict: number; noQuote: number; hidden: number; pending: number }

export function summarize(rows: readonly VarietyRow[], pending: number): Summary {
  const count = (state: ScreenState) => rows.filter((r) => screenStateOf(r) === state).length
  return {
    total: rows.length,
    shown: count("shown"),
    beforeVerdict: count("before-verdict"),
    noQuote: count("no-quote"),
    hidden: count("hidden"),
    pending,
  }
}

// 괄호와 공백을 뺀 이름 (참깨(국산) → 참깨)
const bare = (name: string) => name.replace(/\(.*?\)/g, "").replace(/\s+/g, "")

// KAMIS 원문 이름은 `품목/품종/등급`이다. 첫 마디(품목)와 식재료 이름이 서로 포함하면 후보로 낸다. 참고용이고 자동으로 잇지 않는다
export function similarVarieties<T extends Pick<VarietyRow, "slug" | "name">>(label: string | null, rows: readonly T[]): T[] {
  const head = label ? bare(label.split("/")[0] ?? "") : ""
  if (head.length === 0) return []
  return rows.filter((r) => {
    const name = bare(r.name)
    return name.length > 0 && (name.includes(head) || head.includes(name))
  })
}

export type SeasonalFood = { id: string; name: string; category: string }
export type SeasonalGroup = {
  category: string // 제철달력의 분류 (채소, 과일, 수산 …)
  linked: number // 시세 식재료가 하나라도 묶인 제철 품종 수
  foods: { id: string; name: string; varieties: { slug: string; name: string }[] }[]
}

// 제철 분류마다 제철 품종과, 그 품종에 묶인 시세 식재료 (다대다: 참깨 → 참깨(국산)·참깨(중국)). 분류 순서는 제철 데이터 순서
export function seasonalCoverage(rows: readonly VarietyRow[], foods: readonly SeasonalFood[]): SeasonalGroup[] {
  const groups = new Map<string, SeasonalGroup>()
  for (const food of foods) {
    const group = groups.get(food.category) ?? { category: food.category, linked: 0, foods: [] }
    const varieties = rows.filter((r) => r.seasonal.includes(food.id)).map((r) => ({ slug: r.slug, name: r.name }))
    group.foods.push({ id: food.id, name: food.name, varieties })
    if (varieties.length > 0) group.linked += 1
    groups.set(food.category, group)
  }
  return [...groups.values()]
}
