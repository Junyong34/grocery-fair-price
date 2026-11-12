// pnpm foods:sync가 무엇을 웹에 내보낼지 정하고, 내보내기 전에 걸러야 할 문제를 찾는다 (ADR 0006).
// 파일을 읽지 않는다. scripts/sync-foods.mjs가 Node로 바로 읽으므로 다른 모듈을 값으로 import하지 않는다.
import type { FoodRegistry } from "./food-registry"

type Review = { readonly review: "reviewed" | "unreviewed" }

export type FoodSyncInput = {
  registry: FoodRegistry
  /** 이유식 화면이 가리키는 그림 ID. */
  infantArtIds: readonly string[]
  /** 그림 ID → 그림 메타(art.json). 그림 원본이 없는 기기에서는 null. */
  arts: Readonly<Record<string, Review>> | null
  /** 옛 품종 ID(renamed-foods.ts의 키). */
  renamedIds: readonly string[]
}

export type FoodSyncPlan = {
  /** 고쳐야 할 것. 하나라도 있으면 아무것도 내보내지 않는다. */
  problems: string[]
  /** 알려 줄 것. 내보내기를 막지 않는다. */
  notes: string[]
  /** 내보낼 그림. webId는 apps/web/public/foods 아래 폴더 이름(품종 ID 또는 그림 ID)이다. */
  exports: { webId: string; artId: string }[]
}

const byCodeUnit = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * 웹에 내보낼 그림은 "그림 검수를 마쳤고 어느 화면 데이터든 가리키는 그림"이다.
 * 제철 검증 품종은 품종 ID 폴더에(화면이 품종 ID로 그림을 찾는다), 이유식 그림은 그림 ID 폴더에 낸다.
 */
export function planFoodSync({ registry, infantArtIds, arts, renamedIds }: FoodSyncInput): FoodSyncPlan {
  const problems: string[] = []
  const notes: string[] = []
  const renamed = new Set(renamedIds)
  const verified = Object.entries(registry).filter(([, food]) => food.season === "verified")

  for (const [id, food] of Object.entries(registry)) {
    if (renamed.has(id)) problems.push(`품종 ${id}(${food.name}): 옛 품종 ID다(renamed-foods.ts). 다른 ID를 쓴다.`)
  }

  const withoutSources = verified.filter(([, food]) => food.evidence.sources.length === 0).length
  if (withoutSources) notes.push(`근거 출처가 빈 제철 검증 품종 ${withoutSources}종`)

  if (!arts) return { problems, notes, exports: [] }

  const artByWebId = new Map<string, string>()
  for (const [id, food] of verified) {
    const artId = food.art ?? id
    const label = `품종 ${id}(${food.name})`
    if (!arts[artId]) problems.push(`${label}: 그림 원본이 없다(${artId}). 그림을 그리거나 품종 원본의 art를 고친다.`)
    else if (arts[artId].review !== "reviewed") problems.push(`${label}: 미검수 그림이다(${artId}). 그림 검수를 마치거나 품종을 제철 미검증으로 내린다.`)
    artByWebId.set(id, artId)
  }
  for (const artId of [...new Set(infantArtIds)].sort(byCodeUnit)) {
    const taken = artByWebId.get(artId)
    if (taken && taken !== artId) {
      problems.push(`웹 폴더 ${artId}: 같은 이름의 품종은 다른 그림(${taken})을 쓰는데 이유식 그림 목록도 이 폴더에 그림을 내려 한다. 품종 ID나 art를 고친다.`)
      continue
    }
    if (!arts[artId]) problems.push(`이유식 그림 목록: 그림 원본이 없다(${artId}). infant-art.json을 고치거나 그림을 그린다.`)
    else if (arts[artId].review !== "reviewed") problems.push(`이유식 그림 목록: 미검수 그림이다(${artId}). 그림 검수를 마치거나 infant-art.json에서 뺀다.`)
    artByWebId.set(artId, artId)
  }

  const used = new Set(artByWebId.values())
  const idle = Object.keys(arts).filter((id) => arts[id]!.review === "reviewed" && !used.has(id)).sort(byCodeUnit)
  if (idle.length) notes.push(`검수는 마쳤지만 어느 화면도 쓰지 않아 내보내지 않는 그림 ${idle.length}개: ${idle.join(", ")}`)
  const pending = Object.keys(arts).filter((id) => arts[id]!.review !== "reviewed").sort(byCodeUnit)
  if (pending.length) notes.push(`미검수 그림 ${pending.length}개: ${pending.join(", ")}`)

  const exports = [...artByWebId].map(([webId, artId]) => ({ webId, artId })).sort((a, b) => byCodeUnit(a.webId, b.webId))
  return { problems, notes, exports }
}

/** 품종 원본 글에서 두 번 넘게 나온 품종 ID. JSON.parse는 겹친 키를 말없이 뒤의 값으로 덮으므로 글에서 찾는다. */
export function duplicateFoodIds(text: string): string[] {
  const seen = new Set<string>()
  const duplicated = new Set<string>()
  for (const [, id] of text.matchAll(/^ {2}"([^"]+)": \{/gm)) {
    if (seen.has(id!)) duplicated.add(id!)
    seen.add(id!)
  }
  return [...duplicated]
}
