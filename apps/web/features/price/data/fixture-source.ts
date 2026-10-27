import type { PriceSource } from "./price-source"
import { detailOf } from "./fixtures/details"
import { ALIASES, CATEGORIES, FEATURED_IDS, VARIETIES } from "./fixtures/varieties"

/** 하드코딩 데이터 구현. 와이어프레임 값을 쓴다(.scratch/price-screens/spec.md 3-2). */
export const fixtureSource: PriceSource = {
  async listVarieties() {
    return VARIETIES
  },
  async getVariety(id) {
    const summary = VARIETIES.find((variety) => variety.id === id)
    return summary ? detailOf(summary) : null
  },
  async searchIndex() {
    return {
      varieties: VARIETIES.map(({ id, name, item, category }) => ({ id, name, item, category })),
      aliases: ALIASES,
      categories: CATEGORIES,
    }
  },
  async featuredIds() {
    return FEATURED_IDS
  },
}
