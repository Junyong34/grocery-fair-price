import type { ArtMeta } from "@workspace/seasonal/data/art-meta"
import type { FoodRegistry } from "@workspace/seasonal/data/food-registry"

// 그림 어드민 목록의 계산. 그림 하나를 어느 화면 데이터가 가리키는지 모으고, 목록을 거르고 줄 세운다.

/** 그림 하나를 가리키는 화면 데이터. */
export type ArtUse = {
  /** 이 그림을 쓰는 품종. verified가 false면 제철 미검증이라 제철달력에 나오지 않는다. */
  seasonal: { id: string; name: string; verified: boolean }[]
  /** 이 그림을 쓰는 이유식 항목("과일 도감 mango", "궁합 두부"). */
  infant: string[]
}

export type ArtRow = ArtMeta & { uses: ArtUse }

export type ArtFilter = "all" | "unreviewed" | "reviewed"

type InfantArt = { fruits: Readonly<Record<string, string>>; pairings: Readonly<Record<string, string>> }

/** 그림 ID → 그 그림을 가리키는 화면 데이터. 아무도 안 가리키는 그림은 없다. */
export function artUses(registry: FoodRegistry, infant: InfantArt): Map<string, ArtUse> {
  const uses = new Map<string, ArtUse>()
  const of = (artId: string) => {
    if (!uses.has(artId)) uses.set(artId, { seasonal: [], infant: [] })
    return uses.get(artId)!
  }
  for (const [id, food] of Object.entries(registry)) of(food.art ?? id).seasonal.push({ id, name: food.name, verified: food.season === "verified" })
  for (const [key, artId] of Object.entries(infant.fruits)) of(artId).infant.push(`과일 도감 ${key}`)
  for (const [key, artId] of Object.entries(infant.pairings)) of(artId).infant.push(`궁합 ${key}`)
  return uses
}

/** 화면에 나오는 그림인지. pnpm foods:sync가 웹에 내보내는 조건과 같다(검수 상태는 따로 본다). */
export function isShown(uses: ArtUse): boolean {
  return uses.infant.length > 0 || uses.seasonal.some((food) => food.verified)
}

/** 상태와 검색어로 거르고, 판정할 미검수 그림을 앞에 둔다. */
export function filterArts(rows: readonly ArtRow[], filter: ArtFilter, query: string): ArtRow[] {
  const needle = query.trim().toLowerCase()
  return rows
    .filter((art) => filter === "all" || art.review === filter)
    .filter((art) => !needle || art.name.toLowerCase().includes(needle) || art.id.includes(needle))
    .sort((a, b) => Number(a.review === "reviewed") - Number(b.review === "reviewed") || a.name.localeCompare(b.name, "ko"))
}
