import { parseFoodRegistry, type FoodEntry, type FoodRegistry } from "@workspace/seasonal/data/food-registry"
import { BABY_FRUITS, PROHIBITED_FOODS } from "@workspace/seasonal/data/infant-fruits"
import { PAIRINGS } from "@workspace/seasonal/data/infant-pairings"

// 그림 어드민이 품종 원본(food-registry.json)과 이유식 그림 목록(infant-art.json)을 고치는 계산.
// 파일을 읽고 쓰지 않는다. 고친 결과를 돌려주고, 쓰는 일은 server/use-actions가 한다.

export type NewFood = {
  /** 새 품종 ID. URL과 먹음 기록의 키라 만든 뒤에는 바꾸지 않는다. */
  foodId: string
  /** 이 품종이 쓸 그림의 ID. */
  artId: string
  name: string
  aliases: readonly string[]
  category: FoodEntry["category"]
  months: readonly number[]
  /** 비우면 제철 달 전체를 대표 달로 둔다. */
  peak: readonly number[]
  /** 근거 출처(URL, 자료명). 비면 제철 미검증으로 저장한다. */
  sources: readonly string[]
  /** 출처를 확인한 날(YYYY-MM-DD). 비면 제철 미검증으로 저장한다. */
  checkedAt: string
}

export type RegistryResult = { ok: true; registry: FoodRegistry; /** 제철달력에 나오는지. */ verified: boolean } | { ok: false; error: string }

export type InfantArt = { fruits: Readonly<Record<string, string>>; pairings: Readonly<Record<string, string>> }

const FOOD_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const sortedMonths = (months: readonly number[]) => [...new Set(months)].sort((a, b) => a - b)
const trimmed = (list: readonly string[]) => [...new Set(list.map((item) => item.trim()).filter(Boolean))]

/** 형식 검사(parseFoodRegistry)를 통과한 원본만 돌려준다. */
function checked(registry: FoodRegistry, foodId: string): RegistryResult {
  try {
    const parsed = parseFoodRegistry(registry)
    return { ok: true, registry: parsed, verified: parsed[foodId]?.season === "verified" }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * 그림에 제철 용도를 지정해 새 품종을 더한다.
 * 근거 출처와 확인일이 모두 있어야 제철 검증된 품종이 되고, 하나라도 비면 제철 미검증으로 저장해 제철달력에 나오지 않는다.
 */
export function createFood(registry: FoodRegistry, input: NewFood, renamedIds: readonly string[]): RegistryResult {
  const name = input.name.trim()
  if (!FOOD_ID.test(input.foodId)) return { ok: false, error: "품종 ID는 영문 소문자, 숫자, 하이픈만 써요." }
  if (registry[input.foodId]) return { ok: false, error: `이미 있는 품종 ID예요: ${input.foodId}` }
  if (renamedIds.includes(input.foodId)) return { ok: false, error: `예전에 쓰던 품종 ID라 다시 쓸 수 없어요: ${input.foodId}` }
  if (!name) return { ok: false, error: "표시명을 적어요." }
  const sameName = Object.entries(registry).find(([, food]) => food.name === name)
  if (sameName) return { ok: false, error: `표시명이 다른 품종과 겹쳐요: ${name} (${sameName[0]})` }

  const months = sortedMonths(input.months)
  const peak = input.peak.length ? sortedMonths(input.peak) : months
  if (peak.some((month) => !months.includes(month))) return { ok: false, error: "대표 달은 제철 달 가운데서 골라요." }
  const sources = trimmed(input.sources)
  const checkedAt = input.checkedAt.trim()
  if (checkedAt && !DATE.test(checkedAt)) return { ok: false, error: "확인일은 YYYY-MM-DD로 적어요." }
  const verified = sources.length > 0 && checkedAt !== ""
  if (verified && months.length === 0) return { ok: false, error: "제철 달을 하나 이상 골라요. 달을 모르면 근거를 비워 제철 미검증으로 저장해요." }

  const food: FoodEntry = {
    name,
    aliases: trimmed(input.aliases).filter((alias) => alias !== name),
    category: input.category,
    months,
    peak,
    season: verified ? "verified" : "unverified",
    // 어드민에서 근거를 대고 저장한 품종은 조사로 검증한 것으로 본다. 근거 없이 저장한 것은 사용자가 준 값이다.
    basis: verified ? "survey" : "user",
    ...(input.foodId !== input.artId && { art: input.artId }),
    evidence: { sources, ...(checkedAt && { checkedAt }) },
  }
  return checked({ ...registry, [input.foodId]: food }, input.foodId)
}

export type FoodEdit = {
  name: string
  aliases: readonly string[]
  category: FoodEntry["category"]
  months: readonly number[]
  peak: readonly number[]
  /** 제철 검증 상태. unverified로 내리면 제철달력에서 빠진다. */
  season: FoodEntry["season"]
  /** 이 품종이 쓰는 그림의 ID. 품종 ID와 같으면 따로 적지 않는다. */
  art: string
  /** 이번에 더하는 근거 출처. 이전 출처 앞에 붙고, 이전 출처는 남는다. */
  newSources: readonly string[]
  /** 출처를 확인한 날. 비우면 이전 확인일을 그대로 둔다. */
  checkedAt: string
  /** 달을 그렇게 정한 사유. 비우면 이전 사유를 그대로 둔다. */
  reason: string
}

const sameMonths = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((month, i) => month === b[i])

/**
 * 기존 품종을 고친다. 품종 ID는 바꾸지 않고 품종을 지우지도 않는다. 달력에서 빼려면 season을 unverified로 내린다.
 * 제철 달이나 대표 달을 바꾸거나 제철 검증으로 올릴 때는 이번에 확인한 근거 출처와 확인일이 있어야 한다.
 */
export function editFood(registry: FoodRegistry, foodId: string, edit: FoodEdit): RegistryResult {
  const food = registry[foodId]
  if (!food) return { ok: false, error: `없는 품종이에요: ${foodId}` }
  const name = edit.name.trim()
  if (!name) return { ok: false, error: "표시명을 적어요." }
  const sameName = Object.entries(registry).find(([id, other]) => id !== foodId && other.name === name)
  if (sameName) return { ok: false, error: `표시명이 다른 품종과 겹쳐요: ${name} (${sameName[0]})` }

  const months = sortedMonths(edit.months)
  const peak = edit.peak.length ? sortedMonths(edit.peak) : months
  if (peak.some((month) => !months.includes(month))) return { ok: false, error: "대표 달은 제철 달 가운데서 골라요." }
  const newSources = trimmed(edit.newSources)
  const checkedAt = edit.checkedAt.trim()
  if (checkedAt && !DATE.test(checkedAt)) return { ok: false, error: "확인일은 YYYY-MM-DD로 적어요." }
  const hasNewEvidence = newSources.length > 0 && checkedAt !== ""
  if ((!sameMonths(months, food.months) || !sameMonths(peak, food.peak)) && !hasNewEvidence) return { ok: false, error: "제철 달이나 대표 달을 바꾸려면 근거 출처와 확인일을 적어요." }
  if (edit.season === "verified" && food.season !== "verified" && !hasNewEvidence) return { ok: false, error: "제철 검증으로 올리려면 근거 출처와 확인일을 적어요." }
  if (edit.season === "verified" && months.length === 0) return { ok: false, error: "제철 검증된 품종은 제철 달이 하나 이상 있어야 해요." }

  const reason = edit.reason.trim()
  const next: FoodEntry = {
    name,
    aliases: trimmed(edit.aliases).filter((alias) => alias !== name),
    category: edit.category,
    months,
    peak,
    season: edit.season,
    // 근거 갈래(basis)는 그대로 둔다. 대표 품종을 고르는 core가 편집으로 바뀌지 않게 한다.
    basis: food.basis,
    ...(edit.art && edit.art !== foodId && { art: edit.art }),
    ...(food.conditional && { conditional: true as const }),
    evidence: {
      sources: [...new Set([...newSources, ...food.evidence.sources])],
      ...((checkedAt || food.evidence.checkedAt) && { checkedAt: checkedAt || food.evidence.checkedAt }),
      ...((reason || food.evidence.reason) && { reason: reason || food.evidence.reason }),
      ...(food.evidence.market && { market: food.evidence.market }),
      ...(food.evidence.note && { note: food.evidence.note }),
    },
  }
  return checked({ ...registry, [foodId]: next }, foodId)
}

/** 기존 품종이 이 그림을 쓰게 한다. 품종 ID는 그대로다. */
export function linkArt(registry: FoodRegistry, foodId: string, artId: string): RegistryResult {
  const food = registry[foodId]
  if (!food) return { ok: false, error: `없는 품종이에요: ${foodId}` }
  const kept: FoodEntry = { ...food }
  delete kept.art
  // art는 근거(evidence) 앞에 둔다. 원본의 필드 순서를 지켜 diff에 바뀐 줄만 보이게 한다.
  const { evidence, ...head } = kept
  const next: FoodEntry = foodId === artId ? food.art === undefined ? food : kept : { ...head, art: artId, evidence }
  return checked({ ...registry, [foodId]: next }, foodId)
}

/** 이유식 항목(kind의 key)에 그림을 연결한다. artId가 null이면 연결을 끊는다. */
export function setInfantArt(art: InfantArt, kind: keyof InfantArt, key: string, artId: string | null): InfantArt {
  const next = { ...art[kind] }
  if (artId === null) delete next[key]
  else next[key] = artId
  return { ...art, [kind]: next }
}

/** 그림을 연결할 수 있는 이유식 항목. pairings는 궁합표에 나오는 재료 이름, fruits는 과일 id와 주의 식재료 iconId다. */
export function infantKeys(): { fruits: string[]; pairings: string[] } {
  const names = PAIRINGS.flatMap((row) => [row.name, ...row.good, ...row.bad]).flatMap((name) => name.split("/"))
  return {
    fruits: [...new Set([...BABY_FRUITS.map((fruit) => fruit.id), ...PROHIBITED_FOODS.map((food) => food.iconId)])].sort(),
    pairings: [...new Set(names)].sort((a, b) => a.localeCompare(b, "ko")),
  }
}
