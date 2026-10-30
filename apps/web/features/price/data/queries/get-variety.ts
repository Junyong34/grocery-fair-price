import { db } from "../db"

/** 상세 행: 판정 payload 그대로(VarietyDetail 모양, ADR 0004). 모양 검사는 db-source가 한다. */
export type VarietyDetailRow = { payload: unknown }

/** 품종 id(variety.slug)로 현재 판정 한 행. 없으면 undefined. */
export async function getVarietyRow(id: string): Promise<VarietyDetailRow | undefined> {
  const [row] = await db()<VarietyDetailRow[]>`
    select payload from price.current_judgment where payload ->> 'id' = ${id} limit 1
  `
  return row
}
