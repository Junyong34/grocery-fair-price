// 품종 id가 바뀐 기록. 기기에 저장된 먹음 기록처럼 옛 id를 담은 데이터를 새 id로 옮길 때 쓴다.
// 2026-10-23: 일러스트가 생긴 9종이 일러스트 카탈로그 id로 바뀌었다(.scratch/food-months/proposal.md "반영 결과").

/** 옛 id → 새 id */
export const RENAMED_FOOD_IDS: Readonly<Record<string, string>> = {
  grape: "green-grape",
  "korean-melon": "oriental-melon",
  shiitake: "shiitake-mushroom",
  "pine-mushroom": "matsutake",
  "marsh-clam": "jaecheop-clam",
  "brown-croaker": "croaker",
  "spear-squid": "east-sea-hanchi",
  "swordtip-squid": "jeju-hanchi",
  "marbled-flounder": "spring-flounder",
}

/** id 목록의 옛 id를 새 id로 바꾼다. 차례는 지키고, 바꾼 뒤 겹치면 처음 것만 남긴다. */
export function renameFoodIds(ids: readonly string[]): string[] {
  return [...new Set(ids.map((id) => RENAMED_FOOD_IDS[id] ?? id))]
}
