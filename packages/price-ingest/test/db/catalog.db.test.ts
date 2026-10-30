// 카탈로그를 로컬 DB에 넣어 본다 (ingest-foundation/08). 모두 되돌려 샘플 데이터를 바꾸지 않는다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { applyClasses, applyMappings } from "../../src/catalog/apply.ts"
import { VARIETIES } from "../../src/catalog/varieties.ts"
import type { Sql, Tx } from "../../src/load/db.ts"

import { connectLocalAdmin, connectLocalIngest, inRollback } from "./local.ts"

let admin: Sql
let ingest: Sql

beforeAll(async () => {
  admin = connectLocalAdmin()
  ingest = await connectLocalIngest()
})

afterAll(async () => {
  await admin.end()
  await ingest.end()
})

// 원천 키를 pending으로 등록한다 (적재가 처음 본 키를 등록하는 것과 같은 모양)
async function pendingKey(tx: Tx, source: "kamis" | "ekape", sourceKey: string, keyParts: Record<string, string>) {
  const [row] = await tx<{ id: number }[]>`
    insert into price.source_item (source, source_key, key_parts, first_seen_on, last_seen_on)
    values (${source}, ${sourceKey}, ${tx.json(keyParts)}, '2026-10-20', '2026-10-20') returning id`
  await tx`insert into price.source_code_map (source_item_id, valid_from, status) values (${row!.id}, '2026-10-20', 'pending')`
}

async function mapOf(tx: Tx, sourceKey: string) {
  const [row] = await tx<{ status: string; variety: string | null; spec: string | null; role: string; unit_rule: string | null }[]>`
    select m.status, v.slug as variety, s.slug as spec, m.role, u.rule_code as unit_rule
      from price.source_item si join price.source_code_map m on m.source_item_id = si.id
      left join price.variety v on v.id = m.variety_id left join price.spec s on s.id = m.spec_id
      left join price.unit_rule u on u.id = m.unit_rule_id
     where si.source_key = ${sourceKey} and m.valid_to is null`
  return row
}

async function productMapOf(tx: Tx, goodId: number) {
  const [row] = await tx<{ status: string; variety: string | null; spec: string | null }[]>`
    select pm.status, v.slug as variety, s.slug as spec
      from price.source_item si
      join price.product_source_key k on k.source_item_id = si.id and k.valid_to is null
      join price.product_variety_map pm on pm.product_id = k.product_id and pm.valid_to is null
      left join price.variety v on v.id = pm.variety_id left join price.spec s on s.id = pm.spec_id
     where si.source_key = ${`chamga:${goodId}`}`
  return row
}

describe("분류 표", () => {
  it("품종·규격·제철 매핑·단위 규칙을 넣고, 다시 넣어도 같다. 카탈로그 밖 품종은 숨긴다", async () => {
    await inRollback(admin, async (tx) => {
      const first = await applyClasses(tx)
      expect(first.varieties).toBe(VARIETIES.length)
      expect(first.hidden).toContain("sagwa") // 샘플 시드의 품종
      const [count] = await tx<{ n: number }[]>`select count(*)::int as n from price.variety where status = 'active'`
      expect(count!.n).toBe(VARIETIES.length)

      // 샘플 시드의 한우 등심은 1등급이 기본이었다. 카탈로그는 1+등급
      const specs = await tx<{ slug: string; is_default: boolean }[]>`
        select s.slug, s.is_default from price.spec s join price.variety v on v.id = s.variety_id
         where v.slug = 'hanwoo-sirloin' order by s.sort`
      expect(specs).toEqual([
        { slug: "grade-1plus", is_default: true },
        { slug: "grade-1pp", is_default: false },
        { slug: "grade-1", is_default: false },
      ])
      const seasonal = await tx<{ seasonal_food_id: string }[]>`
        select m.seasonal_food_id from price.variety_seasonal_map m join price.variety v on v.id = m.variety_id
         where v.slug = 'apple'`
      expect(seasonal.map((r) => r.seasonal_food_id)).toEqual(["apple"])

      const again = await applyClasses(tx)
      expect(again.hidden).toEqual([])
    })
  })

  it("ingest_writer는 분류 표를 쓰지 못한다", async () => {
    await expect(inRollback(ingest, (tx) => applyClasses(tx).then(() => {}))).rejects.toThrow(/permission denied/)
  })
})

describe("매핑", () => {
  it("분류 표가 없으면 멈춘다", async () => {
    await inRollback(admin, async (tx) => {
      await pendingKey(tx, "kamis", "kamis:01-400-411-08-05", { se_cd: "01", ctgry_cd: "400", item_cd: "411", vrty_cd: "08", grd_cd: "05" })
      await expect(applyMappings(tx)).rejects.toThrow(/분류 표를 먼저/)
    })
  })

  it("pending 원천 키를 카탈로그대로 잇고, 이미 다르게 정한 것은 고치지 않고 알린다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      await pendingKey(tx, "kamis", "kamis:01-400-411-08-05", { se_cd: "01", ctgry_cd: "400", item_cd: "411", vrty_cd: "08", grd_cd: "05" })
      await pendingKey(tx, "kamis", "kamis:01-200-211-04-04", { se_cd: "01", ctgry_cd: "200", item_cd: "211", vrty_cd: "04", grd_cd: "04" })
      await pendingKey(tx, "kamis", "kamis:01-500-4301-21-2", { se_cd: "01", ctgry_cd: "500", item_cd: "4301", vrty_cd: "21", grd_cd: "2" })
      await pendingKey(tx, "kamis", "kamis:02-400-411-08-05", { se_cd: "02", ctgry_cd: "400", item_cd: "411", vrty_cd: "08", grd_cd: "05" })
      await pendingKey(tx, "kamis", "kamis:01-200-999-00-04", { se_cd: "01", ctgry_cd: "200", item_cd: "999", vrty_cd: "00", grd_cd: "04" })

      const result = await applyMappings(tx)

      expect(await mapOf(tx, "kamis:01-400-411-08-05")).toEqual({ status: "mapped", variety: "apple", spec: "shinano-mid", role: "primary", unit_rule: "retail-ea" })
      // 배추는 철마다 품종 코드가 바뀐다 (`211-*`)
      expect(await mapOf(tx, "kamis:01-200-211-04-04")).toMatchObject({ status: "mapped", variety: "napa-cabbage", spec: "top" })
      // 한우 안심 1+등급은 축평원에도 있어 KAMIS는 secondary (pipeline 6-1)
      expect(await mapOf(tx, "kamis:01-500-4301-21-2")).toMatchObject({ variety: "hanwoo-tenderloin", spec: "grade-1plus", role: "secondary", unit_rule: "retail-g" })
      // 소매가 아닌 구분, 카탈로그에 없는 품목은 pending으로 남는다
      expect((await mapOf(tx, "kamis:02-400-411-08-05"))?.status).toBe("pending")
      expect((await mapOf(tx, "kamis:01-200-999-00-04"))?.status).toBe("pending")

      // 샘플 시드가 이미 정한 매핑 (egg/xl 등)은 그대로 두고 알린다
      expect(await mapOf(tx, "ekape:9903-23-일반란")).toMatchObject({ status: "mapped", variety: "egg", spec: "xl" })
      expect(result.conflicts).toContainEqual({ key: "ekape:9903-23-일반란", current: "egg/xl primary", catalog: "egg/regular primary" })
      expect(result.conflicts.map((c) => c.key)).not.toContain("ekape:4301-22-1+등급") // 같은 품종·규격
      expect(result.pending).toBeGreaterThanOrEqual(2)

      // 다시 돌리면 바꿀 것이 없다
      const again = await applyMappings(tx)
      expect(again.mapped).toBe(0)
      expect(again.ignored).toBe(0)
    })
  })

  it("카탈로그가 정한 매핑은 카탈로그가 바뀌면 고치고, 운영자가 정한 매핑은 그대로 둔다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      await pendingKey(tx, "kamis", "kamis:01-400-411-08-05", { se_cd: "01", ctgry_cd: "400", item_cd: "411", vrty_cd: "08", grd_cd: "05" })
      // 예전 카탈로그가 시나노골드를 다른 규격에 이었던 상태
      await tx`
        update price.source_code_map m
           set status = 'mapped', note = 'catalog', role = 'primary',
               variety_id = s.variety_id, spec_id = s.id, unit_rule_id = (select id from price.unit_rule where rule_code = 'retail-ea' order by version desc limit 1)
          from price.source_item si, price.spec s join price.variety v on v.id = s.variety_id
         where m.source_item_id = si.id and si.source_key = 'kamis:01-400-411-08-05' and v.slug = 'apple' and s.slug = 'hongro-mid'`

      const result = await applyMappings(tx)
      expect(result.changed).toBe(1)
      expect(result.conflicts.map((c) => c.key)).not.toContain("kamis:01-400-411-08-05")
      expect(await mapOf(tx, "kamis:01-400-411-08-05")).toEqual({ status: "mapped", variety: "apple", spec: "shinano-mid", role: "primary", unit_rule: "retail-ea" })
      // 샘플 시드의 매핑(note가 catalog 아님)은 운영자가 정한 것으로 본다
      expect(await mapOf(tx, "ekape:9903-23-일반란")).toMatchObject({ variety: "egg", spec: "xl" })
      expect((await applyMappings(tx)).changed).toBe(0)
    })
  })

  it("참가격: 카탈로그의 신선 상품은 잇고, 원산지 미정 상품은 pending, 나머지 식품 상품은 ignored", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const before = await productMapOf(tx, 302)
      expect(before?.status).toBe("pending") // 샘플 데이터의 배추(1.5~2kg)
      await applyMappings(tx)
      expect(await productMapOf(tx, 302)).toEqual({ status: "mapped", variety: "napa-cabbage", spec: "top" })
      expect((await productMapOf(tx, 1000))?.status).toBe("ignored") // 가공식품
      const [left] = await tx<{ n: number }[]>`
        select count(*)::int as n from price.product_variety_map pm
          join price.product_source_key k on k.product_id = pm.product_id
          join price.source_item si on si.id = k.source_item_id
         where pm.status = 'pending' and si.source_key not in ('chamga:1738', 'chamga:1786', 'chamga:1787', 'chamga:1788', 'chamga:1789')`
      expect(left!.n).toBe(0)
    })
  })

  it("분류 표를 넣은 뒤 ingest_writer 권한으로 매핑을 넣는다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      // 같은 트랜잭션 안에서 권한·RLS를 ingest_writer로 (멤버십도 함께 되돌린다)
      await tx`grant ingest_writer to postgres`
      await tx`set local role ingest_writer`
      const result = await applyMappings(tx)
      expect(result.mapped).toBeGreaterThan(0)
    })
  })
})
