// 적재 때 품종 매핑과 기준 단위 가격, 다시 매핑 (ingest-foundation/09). 모두 되돌린다.
// 소유자 접속으로 분류 표를 넣고 같은 트랜잭션에서 적재한다. 1999년 날짜라 샘플 데이터와 겹치지 않는다.
import { afterAll, describe, expect, it } from "vitest"

import { applyClasses, applyMappings } from "../../src/catalog/apply.ts"
import type { Tx } from "../../src/load/db.ts"
import { loadRawFile } from "../../src/load/load-file.ts"
import { remapObservations } from "../../src/load/variety.ts"
import type { KamisRow } from "../../src/sources/kamis.ts"

import { kamisFile, kamisSample, pending } from "./files.ts"
import { connectLocalAdmin, inRollback } from "./local.ts"

const admin = connectLocalAdmin()

afterAll(async () => {
  await admin.end()
})

// 배추 샘플을 다른 품목 코드로 바꾼 행
function asKamis(edit: Partial<KamisRow>): KamisRow[] {
  return kamisSample("1999", (row) => Object.assign(row, edit))
}

async function load(tx: Tx, rows: KamisRow[]) {
  const file = kamisFile(rows, null)
  return loadRawFile(tx, await pending(tx, file), file)
}

type Mapped = { variety: string | null; spec: string | null; price_raw: number; per_base: string | null; rule: string | null }

async function observationsOf(tx: Tx, sourceKey: string): Promise<Mapped[]> {
  return tx<Mapped[]>`
    select v.slug as variety, s.slug as spec, o.price_raw, o.price_per_base::text as per_base, u.rule_code as rule
      from price.observation o
      join price.source_item si on si.id = o.source_item_id
      left join price.variety v on v.id = o.variety_id
      left join price.spec s on s.id = o.spec_id
      left join price.unit_rule u on u.id = o.unit_rule_id
     where si.source_key = ${sourceKey} and o.obs_date < '2000-01-01' -- 이 테스트가 넣은 행만 (샘플 데이터는 2026년)
     order by o.obs_date, o.place_id`
}

describe("적재 때 품종 매핑", () => {
  it("처음 본 KAMIS 키가 카탈로그에 있으면 바로 잇고 1포기를 1개로 센다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      await load(tx, asKamis({ item_cd: "279", vrty_cd: "00", item_nm: "알배기배추", vrty_nm: "알배기배추" }))
      const rows = await observationsOf(tx, "kamis:01-200-279-00-04")
      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) {
        expect(row).toMatchObject({ variety: "baby-napa-cabbage", spec: "top", rule: "retail-ea" })
        expect(Number(row.per_base)).toBe(row.price_raw) // 1포기 = 1개
      }
    })
  })

  it("10개 단위는 1개로 나누고, 1손은 1개로 바꾸지 않아 품종만 잇는다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      await load(tx, asKamis({ ctgry_cd: "400", item_cd: "411", vrty_cd: "08", unit: "개", unit_sz: "10" }))
      for (const row of await observationsOf(tx, "kamis:01-400-411-08-04")) {
        expect(row).toMatchObject({ variety: "apple", spec: "top" })
        expect(Number(row.per_base)).toBeCloseTo(row.price_raw / 10, 2)
      }
      await load(tx, asKamis({ ctgry_cd: "600", item_cd: "611", vrty_cd: "03", grd_cd: "30", unit: "손", unit_sz: "1" }))
      for (const row of await observationsOf(tx, "kamis:01-600-611-03-30")) {
        expect(row).toMatchObject({ variety: "mackerel-kr", spec: "salted", per_base: null, rule: null })
      }
    })
  })

  it("카탈로그에 없는 키는 pending으로 남고 품종을 비운다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      await load(tx, asKamis({ item_cd: "8299" }))
      const rows = await observationsOf(tx, "kamis:01-200-8299-02-04")
      expect(rows.every((row) => row.variety === null && row.per_base === null)).toBe(true)
    })
  })

  it("분류 표가 없어도 적재는 멈추지 않는다 (품종만 비운다)", async () => {
    await inRollback(admin, async (tx) => {
      const outcome = await load(tx, asKamis({ item_cd: "279", vrty_cd: "00" }))
      expect(outcome.status).toBe("loaded")
      const rows = await observationsOf(tx, "kamis:01-200-279-00-04")
      expect(rows.every((row) => row.variety === null)).toBe(true)
    })
  })
})

describe("다시 매핑", () => {
  it("매핑을 넣으면 이미 쌓인 참가격 관측값에 품종과 상품 용량으로 낸 기준 단위 가격이 붙는다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      await applyMappings(tx)
      expect(await remapObservations(tx, "chamga")).toBeGreaterThan(0)
      const egg = await tx<{ variety: string; per_base: string; price_raw: number }[]>`
        select v.slug as variety, o.price_per_base::text as per_base, o.price_raw
          from price.observation o
          join price.product_source_key k on k.product_id = o.product_id
          join price.source_item si on si.id = k.source_item_id
          join price.variety v on v.id = o.variety_id
         where si.source_key = 'chamga:1072'` // 계란 10개 → 기준 단위 30구
      expect(egg.length).toBeGreaterThan(0)
      for (const row of egg) expect(Number(row.per_base)).toBeCloseTo((row.price_raw / 10) * 30, 2)

      // 다시 돌려도 바꿀 것이 없다
      expect(await remapObservations(tx, "chamga")).toBe(0)
    })
  })

  it("매핑을 거두면 품종과 기준 단위 가격을 비운다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      await load(tx, asKamis({ item_cd: "279", vrty_cd: "00" }))
      await tx`
        update price.source_code_map m set status = 'ignored', variety_id = null, spec_id = null, unit_rule_id = null
          from price.source_item si where si.id = m.source_item_id and si.source_key = 'kamis:01-200-279-00-04'`
      expect(await remapObservations(tx, "kamis")).toBeGreaterThan(0)
      const rows = await observationsOf(tx, "kamis:01-200-279-00-04")
      expect(rows.every((row) => row.variety === null && row.per_base === null && row.rule === null)).toBe(true)
    })
  })
})
