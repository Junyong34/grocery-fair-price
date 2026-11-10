// 상품 분류 뷰 price.product_classification의 규칙 (GLOSSARY "상품"). 롤백 묶음 안에서 상품의 품목과 대응표를 바꿔 본다.
// 로컬 시드는 참가격 AL 소분류 130개를 대응표에 넣어 둔다(supabase/seed.sql).
import { afterAll, describe, expect, it } from "vitest"

import type { Tx } from "../../src/load/db.ts"
import { connectLocalAdmin, inRollback } from "./local.ts"

const admin = connectLocalAdmin()

afterAll(async () => {
  await admin.end()
})

type Row = { category_name: string | null; item_name: string | null; placed_by: string; al_code: string | null }

// 샘플 상품 goodId 1000 (팔도 왕뚜껑)
async function sample(tx: Tx): Promise<{ id: number; alCode: string }> {
  const [p] = await tx<{ id: number; al_code: string }[]>`
    select k.product_id as id, c.al_code
      from price.product_source_key k
      join price.source_item si on si.id = k.source_item_id
      join price.product_classification c on c.product_id = k.product_id
     where si.source_key = 'chamga:1000' and k.valid_to is null`
  return { id: p!.id, alCode: p!.al_code }
}

const classify = async (tx: Tx, id: number) =>
  (await tx<Row[]>`select category_name, item_name, placed_by, al_code from price.product_classification where product_id = ${id}`)[0]!

describe("상품 분류", () => {
  it("품목이 있으면 그 품목과 품목의 카테고리를 쓴다 (대응표보다 먼저)", async () => {
    await inRollback(admin, async (tx) => {
      const p = await sample(tx)
      const [item] = await tx<{ id: number; name: string; category: string }[]>`
        select i.id, i.name, c.name as category from price.item i join price.category c on c.id = i.category_id where c.slug = 'vegetable' limit 1`
      await tx`update price.product set item_id = ${item!.id} where id = ${p.id}`
      expect(await classify(tx, p.id)).toEqual({ category_name: item!.category, item_name: item!.name, placed_by: "item", al_code: p.alCode })
    })
  })

  it("품목이 없으면 대응표의 카테고리와 AL 소분류 이름을 쓴다", async () => {
    await inRollback(admin, async (tx) => {
      const p = await sample(tx)
      await tx`update price.product set item_id = null where id = ${p.id}`
      const [map] = await tx<{ class_name: string; category: string }[]>`
        select m.class_name, c.name as category from price.category_source_map m join price.category c on c.id = m.category_id
         where m.source = 'chamga' and m.source_class = ${p.alCode}`
      expect(await classify(tx, p.id)).toEqual({ category_name: map!.category, item_name: map!.class_name, placed_by: "source_class", al_code: p.alCode })
    })
  })

  it("둘 다 없으면 카테고리·품목이 null이고 none이다 (대체 이름을 쓰지 않는다)", async () => {
    await inRollback(admin, async (tx) => {
      const p = await sample(tx)
      await tx`update price.product set item_id = null where id = ${p.id}`
      await tx`delete from price.category_source_map where source = 'chamga' and source_class = ${p.alCode}`
      expect(await classify(tx, p.id)).toEqual({ category_name: null, item_name: null, placed_by: "none", al_code: p.alCode })
    })
  })
})
