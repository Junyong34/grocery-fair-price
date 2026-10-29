// 시세 요약의 표본 충분(meets_min_n)과 같은 값이 이어진 날 수(stale_days) (judgment.md 6장).
// 롤백 묶음 안에서 2097년 날짜의 시세 요약을 직접 넣고 refreshQuoteQuality를 부른다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { addDays } from "../../src/ingest/collect.ts"
import { refreshQuoteQuality } from "../../src/load/daily-quote.ts"
import type { Sql, Tx } from "../../src/load/db.ts"
import { connectLocalAdmin, connectLocalIngest, inRollback } from "./local.ts"

let sql: Sql

beforeAll(async () => {
  sql = await connectLocalIngest()
})

afterAll(async () => {
  await sql.end()
})

const FIRST = "2097-03-01"
const days = (count: number, from = FIRST) => Array.from({ length: count }, (_, i) => addDays(from, i))

type Row = { day: string; value: number; n: number }

// 샘플 규격 하나에 소매 national 시세 요약을 넣는다
async function seed(tx: Tx, sources: string[], rows: readonly Row[]): Promise<{ variety_id: number; spec_id: number }> {
  const [spec] = await tx<{ variety_id: number; spec_id: number }[]>`
    select variety_id, id as spec_id from price.spec order by variety_id, id limit 1`
  await tx`
    insert into price.daily_quote (variety_id, spec_id, price_tier, basis, scope_key, obs_date, value, median, n, sources, calc_version, computed_at)
    select ${spec!.variety_id}, ${spec!.spec_id}, 'retail', 'quote', 'national', r.day, r.value, r.value, r.n, ${sources}, 'test', now()
      from jsonb_to_recordset(${tx.json(rows)}) as r (day date, value numeric, n int)`
  return spec!
}

async function quality(tx: Tx): Promise<{ day: string; meets: boolean | null; stale: number | null }[]> {
  return tx`
    select obs_date::text as day, meets_min_n as meets, stale_days as stale from price.daily_quote
     where obs_date >= ${FIRST} and obs_date < '2098-01-01' order by obs_date`
}

describe("시세 요약 품질", () => {
  it("관측 수가 최근 182일 중앙값의 절반보다 적은 날은 표본 부족이다. 시장 표본은 이어진 날을 세지 않는다", async () => {
    await inRollback(sql, async (tx) => {
      const ns = [40, 42, 38, 40, 21, 19, 40]
      await seed(tx, ["kamis"], days(7).map((day, i) => ({ day, value: 1000, n: ns[i]! })))
      await refreshQuoteQuality(tx, "quote", days(7))
      expect(await quality(tx)).toEqual(
        days(7).map((day, i) => ({ day, meets: ![5].includes(i), stale: null })), // 19 < 40 × 0.5. 21은 넘는다
      )
    })
  })

  it("전국 값 하나로 오는 시세(축평원)는 같은 값이 이어진 날 수를 센다", async () => {
    await inRollback(sql, async (tx) => {
      const values = [100, 100, 100, 120, 120, 100]
      await seed(tx, ["ekape"], days(6).map((day, i) => ({ day, value: values[i]!, n: 1 })))
      await refreshQuoteQuality(tx, "quote", days(6))
      expect((await quality(tx)).map((r) => [r.meets, r.stale])).toEqual([
        [true, 1],
        [true, 2],
        [true, 3],
        [true, 1],
        [true, 2],
        [true, 1],
      ])
    })
  })

  it("앞의 날이 나중에 들어오면 그 뒤로 이어진 날 수도 다시 센다 (백필)", async () => {
    await inRollback(sql, async (tx) => {
      const later = days(3, addDays(FIRST, 2))
      await seed(tx, ["ekape"], later.map((day) => ({ day, value: 100, n: 1 })))
      await refreshQuoteQuality(tx, "quote", later)
      expect((await quality(tx)).map((r) => r.stale)).toEqual([1, 2, 3])

      await seed(tx, ["ekape"], days(2).map((day) => ({ day, value: 100, n: 1 })))
      await refreshQuoteQuality(tx, "quote", days(2))
      expect((await quality(tx)).map((r) => r.stale)).toEqual([1, 2, 3, 4, 5])
    })
  })

  it("기준(calc_param aggregate.min_n)이 없으면 표본 충분을 비워 둔다", async () => {
    const admin = connectLocalAdmin() // calc_param은 운영자가 바꾼다 (ingest_writer는 읽기만)
    try {
      await inRollback(admin, async (tx) => {
        await tx`update price.calc_param set value = null where key = 'aggregate.min_n'`
        await seed(tx, ["kamis"], days(2).map((day) => ({ day, value: 1000, n: 40 })))
        await refreshQuoteQuality(tx, "quote", days(2))
        expect((await quality(tx)).map((r) => r.meets)).toEqual([null, null])
      })
    } finally {
      await admin.end()
    }
  })
})
