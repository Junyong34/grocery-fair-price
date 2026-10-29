// 평소가 쓰기 (judgment.md 1·2장). 롤백 묶음 안에서 2096년 날짜의 소매 national 시세를 직접 넣고 usual 명령의 쓰기를 본다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { addDays } from "../../src/ingest/collect.ts"
import type { Sql, Tx } from "../../src/load/db.ts"
import { USUAL_METHOD } from "../../src/usual/compute.ts"
import { writeUsual } from "../../src/usual/cli.ts"
import { dayOfYear } from "../../src/usual/season.ts"
import { connectLocalIngest, inRollback } from "./local.ts"

let sql: Sql

beforeAll(async () => {
  sql = await connectLocalIngest()
})

afterAll(async () => {
  await sql.end()
})

const FROM = "2093-01-01"
const TO = "2096-10-28"

// 샘플 품종 하나의 기본 규격에 매일 계절대로 오르내리는 시세를 넣는다
async function seed(tx: Tx): Promise<{ variety_id: number; spec_id: number }> {
  const [spec] = await tx<{ variety_id: number; spec_id: number }[]>`
    select variety_id, id as spec_id from price.spec order by variety_id, id limit 1`
  const rows = []
  for (let day = FROM, i = 0; day <= TO; day = addDays(day, 1), i++) {
    const price = 1000 * 1.05 ** (i / 365) * (1 + 0.2 * -Math.cos((2 * Math.PI * dayOfYear(day)) / 365))
    rows.push({ day, price: Math.round(price) })
  }
  await tx`
    insert into price.daily_quote (variety_id, spec_id, price_tier, basis, scope_key, obs_date, value, median, n, sources, calc_version, computed_at)
    select ${spec!.variety_id}, ${spec!.spec_id}, 'retail', 'quote', 'national', r.day, r.price, r.price, 3, '{kamis}', 'test', now()
      from jsonb_to_recordset(${tx.json(rows)}) as r (day date, price numeric)`
  return spec!
}

describe("평소가 쓰기", () => {
  it("기간의 평소가와 계절비율 표를 쓰고, 다시 돌려도 같은 행이며, 가장 최근 행에 판정 구간이 있다", async () => {
    await inRollback(sql, async (tx) => {
      const spec = await seed(tx)
      const first = await writeUsual(tx, { to: TO, days: 7 })
      expect(first).toMatchObject({ from: "2096-10-22", to: TO, usualRows: 7, removed: 0 })
      const rows = await tx<{ as_of: string; value: string; components: { band?: unknown; season_index: number } }[]>`
        select as_of::text, value::text, components from price.usual_price
         where variety_id = ${spec.variety_id} and spec_id = ${spec.spec_id} and method = ${USUAL_METHOD} order by as_of`
      expect(rows.map((r) => r.as_of)).toEqual(Array.from({ length: 7 }, (_, i) => addDays("2096-10-22", i)))
      expect(rows.at(-1)!.components.band).toMatchObject({ basis: "variety" }) // 판정한 날이 1년을 넘는다 (2094-12-30부터)
      expect(rows[0]!.components.band).toBeUndefined()
      const [season] = await tx<{ n: number; as_of: string }[]>`
        select count(*)::int as n, min(as_of)::text as as_of from price.season_index where variety_id = ${spec.variety_id} and spec_id = ${spec.spec_id}`
      expect(season).toEqual({ n: 365, as_of: "2096-09-30" })

      const again = await writeUsual(tx, { to: TO, days: 7 })
      expect(again).toMatchObject({ usualRows: 7, removed: 7, seasonRows: first.seasonRows })
    })
  })
})
