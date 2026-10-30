// 판정 배치 쓰기 (ingest-foundation/11). 롤백 묶음 안에서 2096년 날짜의 시세와 평소가를 직접 넣고 판정 묶음과 포인터를 본다.
import type { VarietyDetail } from "@workspace/price/types"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type { Sql, Tx } from "../../src/load/db.ts"
import { KEEP_BATCHES, writeJudgment } from "../../src/judgment/cli.ts"
import { connectLocalIngest, inRollback } from "./local.ts"

let sql: Sql

beforeAll(async () => {
  sql = await connectLocalIngest()
})

afterAll(async () => {
  await sql.end()
})

const DAY = "2096-10-28"

// 활성 품종 하나의 대표 규격에 이틀 시세, 업태 시세, 평소가(가장 최근 행에 판정 차이 +30%, 구간 ±10%)를 넣는다
async function seed(tx: Tx): Promise<{ variety_id: number; spec_id: number; slug: string }> {
  const [spec] = await tx<{ variety_id: number; spec_id: number; slug: string }[]>`
    select v.id as variety_id, s.id as spec_id, v.slug from price.variety v
      join price.spec s on s.variety_id = v.id and s.is_default
     where v.status = 'active' order by v.id limit 1`
  await tx`
    insert into price.daily_quote (variety_id, spec_id, price_tier, basis, scope_key, obs_date, value, min, max, n, sources, meets_min_n, calc_version, computed_at)
    values (${spec!.variety_id}, ${spec!.spec_id}, 'retail', 'quote', 'national', '2096-10-27', 1250, 1000, 1500, 40, '{kamis}', true, 'test', now()),
           (${spec!.variety_id}, ${spec!.spec_id}, 'retail', 'quote', 'national', ${DAY}, 1300, 1000, 1600, 42, '{kamis}', true, 'test', now()),
           (${spec!.variety_id}, ${spec!.spec_id}, 'retail', 'quote', 'market_type:large_retail', ${DAY}, 1200, 1000, 1400, 20, '{kamis}', true, 'test', now())`
  await tx`
    insert into price.usual_price (variety_id, spec_id, as_of, value, method, components)
    values (${spec!.variety_id}, ${spec!.spec_id}, '2096-10-27', 990, 'test', '{}'),
           (${spec!.variety_id}, ${spec!.spec_id}, ${DAY}, 1000, 'test', '{"deviation": 0.3, "band": {"low": -0.1, "high": 0.1, "basis": "variety"}}')`
  return spec!
}

describe("판정 배치 쓰기", () => {
  it("대표 규격의 판정 행을 새 묶음에 쓰고 포인터를 바꾼다", async () => {
    await inRollback(sql, async (tx) => {
      const spec = await seed(tx)
      const r = await writeJudgment(tx, { trigger: "test" })
      expect(r).toMatchObject({ status: "ready", note: null })
      expect(r.rows).toBeGreaterThan(0)

      const [row] = await tx<{ batch_id: string; as_of: string; today_price: string; usual: string; verdict: string; diff_pct: string; payload: VarietyDetail }[]>`
        select batch_id::text, as_of::text, today_price::text, usual::text, verdict, diff_pct::text, payload
          from price.current_judgment where variety_id = ${spec.variety_id}`
      expect(row).toMatchObject({ batch_id: String(r.batchId), as_of: DAY, today_price: "1300.00", usual: "1000.00", verdict: "expensive", diff_pct: "30.00" })
      expect(row!.payload).toMatchObject({
        id: spec.slug,
        price: 1300,
        usual: 1000,
        verdict: { kind: "pricey", pct: 30 },
        band: { lower: -10, upper: 10 },
        surveyedOn: DAY,
        sampleSize: 42,
        meetsMinN: true,
        stale: false,
        range: { min: 1000, max: 1600, n: 42 },
        marketTypes: [{ type: "large_retail", median: 1200, n: 20 }],
        trend: [
          { date: "2096-10-27", price: 1250, usual: 990 },
          { date: DAY, price: 1300, usual: 1000 },
        ],
        forecast: [],
        basis: { source: "KAMIS", scope: "전국 조사 시장" },
      })
      const [batch] = await tx<{ status: string; trigger: string }[]>`select status, trigger from price.judgment_batch where id = ${r.batchId}`
      expect(batch).toEqual({ status: "ready", trigger: "test" })
    })
  })

  it("판정 행이 없으면 묶음을 failed로 두고 포인터를 바꾸지 않는다", async () => {
    await inRollback(sql, async (tx) => {
      await seed(tx)
      const first = await writeJudgment(tx, { trigger: "test" })
      await tx`delete from price.daily_quote where basis = 'quote' and scope_key = 'national'`
      const second = await writeJudgment(tx, { trigger: "test" })
      expect(second).toMatchObject({ status: "failed", rows: 0, note: "판정 행이 없다" })
      const [current] = await tx<{ batch_id: string }[]>`select batch_id::text from price.judgment_current`
      expect(current!.batch_id).toBe(String(first.batchId))
    })
  })

  it(`묶음은 최근 ${KEEP_BATCHES}개와 지금 묶음만 남는다`, async () => {
    await inRollback(sql, async (tx) => {
      await seed(tx)
      let last = 0
      for (let i = 0; i < KEEP_BATCHES + 2; i++) last = (await writeJudgment(tx, { trigger: "test" })).batchId
      const batches = await tx<{ id: number }[]>`select id::int from price.judgment_batch order by 1`
      expect(batches.length).toBe(KEEP_BATCHES)
      expect(batches.at(-1)!.id).toBe(last)
    })
  })
})
