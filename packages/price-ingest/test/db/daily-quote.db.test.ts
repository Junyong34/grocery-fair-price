// 일자 요약(daily_quote) 다시 계산 (ingest-foundation/10). 모두 되돌린다. KAMIS 행은 1999년 날짜로 넣는다.
import { afterAll, describe, expect, it } from "vitest"

import { applyClasses, applyMappings } from "../../src/catalog/apply.ts"
import { CALC_VERSION, recomputeDailyQuote } from "../../src/load/daily-quote.ts"
import type { Tx } from "../../src/load/db.ts"
import { loadRawFile } from "../../src/load/load-file.ts"
import { remapObservations } from "../../src/load/variety.ts"

import { kamisFile, kamisSample, pending } from "./files.ts"
import { connectLocalAdmin, inRollback } from "./local.ts"

const admin = connectLocalAdmin()

afterAll(async () => {
  await admin.end()
})

// 배추 샘플(14일, 시장 48곳)을 알배기배추 코드로 바꿔 넣는다. 날짜는 1999-09-28~10-11
async function loadBabyCabbage(tx: Tx) {
  const rows = kamisSample("1999", (row) => Object.assign(row, { item_cd: "279", vrty_cd: "00" }))
  const file = kamisFile(rows, null)
  await loadRawFile(tx, await pending(tx, file), file)
  const days = await tx<{ day: string }[]>`
    select distinct o.obs_date::text as day from price.observation o join price.source_item si on si.id = o.source_item_id
     where si.source_key = 'kamis:01-200-279-00-04' order by 1`
  return days.map((d) => d.day)
}

type Quote = { scope_key: string; obs_date: string; value: string; n: number; sources: string[]; calc_version: string }

async function quotesOf(tx: Tx, slug: string): Promise<Quote[]> {
  return tx<Quote[]>`
    select q.scope_key, q.obs_date::text, q.value::text, q.n, q.sources, q.calc_version
      from price.daily_quote q join price.variety v on v.id = q.variety_id
     where v.slug = ${slug} order by q.obs_date, q.scope_key`
}

describe("시세 일자 요약", () => {
  it("시장 표본의 중앙값을 전국·시장 유형별로 낸다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const days = await loadBabyCabbage(tx)
      const result = await recomputeDailyQuote(tx, "quote", days, "1999-10-01")
      expect(result.written).toBeGreaterThan(0)

      const quotes = await quotesOf(tx, "baby-napa-cabbage")
      const day = days[0]!
      const national = quotes.find((q) => q.obs_date === day && q.scope_key === "national")!
      const [expected] = await tx<{ median: string; n: number }[]>`
        select round(percentile_cont(0.5) within group (order by o.price_per_base)::numeric, 2)::text as median,
               count(distinct o.place_id)::int as n
          from price.observation o join price.source_item si on si.id = o.source_item_id
         where si.source_key = 'kamis:01-200-279-00-04' and o.obs_date = ${day}`
      expect(national).toMatchObject({ value: expected!.median, n: expected!.n, sources: ["kamis"], calc_version: CALC_VERSION })
      expect(quotes.some((q) => q.obs_date === day && q.scope_key.startsWith("market_type:"))).toBe(true)

      // 다시 계산해도 바뀌는 행이 없다
      expect(await recomputeDailyQuote(tx, "quote", days, "1999-10-01")).toEqual({ written: 0, removed: 0 })
    })
  })

  it("매핑을 거두면 그날의 요약을 지우고, 보존 기간(90일) 밖의 날은 건드리지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      const days = await loadBabyCabbage(tx)
      await recomputeDailyQuote(tx, "quote", days, "1999-10-01")
      const before = (await quotesOf(tx, "baby-napa-cabbage")).length

      await tx`
        update price.source_code_map m set status = 'ignored', variety_id = null, spec_id = null, unit_rule_id = null
          from price.source_item si where si.id = m.source_item_id and si.source_key = 'kamis:01-200-279-00-04'`
      await remapObservations(tx, "kamis")

      // 기준일이 2000-01-01이면 1999-10-03 전(90일 밖)의 요약은 남고, 그 뒤의 요약만 지워진다
      const keepFrom = "1999-10-03"
      expect(days.some((d) => d < keepFrom) && days.some((d) => d >= keepFrom)).toBe(true)
      await recomputeDailyQuote(tx, "quote", days, "2000-01-01")
      const left = await quotesOf(tx, "baby-napa-cabbage")
      expect(left.length).toBeGreaterThan(0)
      expect(left.every((q) => q.obs_date < keepFrom)).toBe(true)

      const result = await recomputeDailyQuote(tx, "quote", days, "1999-10-01")
      expect(result.removed).toBe(left.length)
      expect(before).toBeGreaterThan(left.length)
      expect(await quotesOf(tx, "baby-napa-cabbage")).toEqual([])
    })
  })
})

describe("판매가 일자 요약", () => {
  it("참가격 판매가를 전국·업태별로, 점포는 재등록 사슬로 센다", async () => {
    await inRollback(admin, async (tx) => {
      await applyClasses(tx)
      await applyMappings(tx)
      await remapObservations(tx, "chamga")
      const days = await tx<{ day: string }[]>`
        select distinct obs_date::text as day from price.observation where obs_kind = 'shelf_price' and variety_id is not null`
      expect(days.length).toBeGreaterThan(0)
      await recomputeDailyQuote(tx, "shelf_price", days.map((d) => d.day), "2026-10-01")

      const quotes = await tx<{ scope_key: string; n: number; promo_excluded_n: number; n_obs: number }[]>`
        select q.scope_key, q.n, q.promo_excluded_n,
               (select count(distinct st.lineage_id)::int from price.observation o join price.store st on st.place_id = o.place_id
                 where o.variety_id = q.variety_id and o.spec_id = q.spec_id and o.obs_date = q.obs_date
                   and o.price_per_base is not null
                   and not (coalesce(o.promo_discount, false) or coalesce(o.promo_one_plus_one, false))) as n_obs
          from price.daily_quote q join price.variety v on v.id = q.variety_id
         where q.basis = 'shelf_price' and v.slug = 'egg' and q.scope_key = 'national'`
      expect(quotes.length).toBeGreaterThan(0)
      for (const q of quotes) expect(q.n).toBe(q.n_obs)
      const channels = await tx<{ n: number }[]>`
        select count(*)::int as n from price.daily_quote where basis = 'shelf_price' and scope_key like 'channel:%'`
      expect(channels[0]!.n).toBeGreaterThan(0)
    })
  })
})
