import { db } from "../db"

/** 목록 행: 판정 payload에서 무거운 키를 뺀 jsonb. 모양 검사는 db-source가 한다. */
export type VarietyListRow = { summary: unknown }

// 순서는 카테고리(category.sort) · 품종 이름으로 고정한다. 화면은 받은 순서대로 그린다(spec 4장).
export async function listVarietyRows(): Promise<VarietyListRow[]> {
  return db()<VarietyListRow[]>`
    select cj.payload - 'trend' - 'forecast' - 'places' - 'shelf' - 'marketTypes' - 'range' - 'band' as summary
    from price.current_judgment cj
    join price.variety v on v.id = cj.variety_id
    join price.item i on i.id = v.item_id
    join price.category c on c.id = i.category_id
    order by c.sort nulls last, c.name, cj.payload ->> 'name'
  `
}
