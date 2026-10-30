import { db } from "../db"

/** 검색 재료 중 DB에서 읽는 부분: 별칭과 카테고리. 품종 부분은 db-source가 목록에서 뽑는다. */
export type SearchExtrasRow = { aliases: unknown; categories: unknown }

// 별칭은 품종(slug) 아니면 품목(이름) 하나를 가리킨다(alias의 check). 카테고리는 보여 줄 순서대로.
export async function getSearchExtrasRow(): Promise<SearchExtrasRow> {
  const [row] = await db()<SearchExtrasRow[]>`
    select
      (
        select coalesce(jsonb_agg(
          case when a.variety_id is not null
            then jsonb_build_object('text', a.text, 'varietyId', v.slug)
            else jsonb_build_object('text', a.text, 'item', i.name)
          end order by a.id), '[]'::jsonb)
        from price.alias a
        left join price.variety v on v.id = a.variety_id
        left join price.item i on i.id = a.item_id
      ) as aliases,
      (
        select coalesce(jsonb_agg(c.name order by c.sort nulls last, c.name), '[]'::jsonb)
        from price.category c
      ) as categories
  `
  return row!
}
