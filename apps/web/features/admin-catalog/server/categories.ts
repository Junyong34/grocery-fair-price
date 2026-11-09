import "server-only"

import { ownerDb } from "./owner-db"

export type CategoryRow = { id: number; slug: string; name: string; sort: number | null; items: number; varieties: number }

// 지금 보이는 순서(sort, 정하지 않았으면 뒤로, 같으면 번호순)와 딸린 품목·품종 수
export async function listCategories(): Promise<CategoryRow[]> {
  return ownerDb()<CategoryRow[]>`
    select c.id, c.slug, c.name, c.sort,
           (select count(*)::int from price.item i where i.category_id = c.id) as items,
           (select count(*)::int from price.variety v join price.item i on i.id = v.item_id where i.category_id = c.id) as varieties
      from price.category c
     order by c.sort nulls last, c.id`
}
