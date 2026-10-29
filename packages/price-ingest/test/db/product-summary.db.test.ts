// 참가격 상품 요약 (ingest-foundation/07, pipeline 3-4). price-db 샘플 데이터(2026-09-25 팔도 왕뚜껑 goodId 1000, 419개 점포)로
// 정부 화면 값과 맞춘다 (gov-price-sites.md 1장: 업태별 점포 수, 판매처 2단 평균). 모두 롤백 묶음 안이다.
import { afterAll, describe, expect, it } from "vitest"

import type { Tx } from "../../src/load/db.ts"
import { recomputeProductSummary, surveyDaysWithoutSummary } from "../../src/load/product-summary.ts"
import { connectLocalAdmin, inRollback } from "./local.ts"

const admin = connectLocalAdmin()
const SURVEY_DAY = "2026-09-25"

afterAll(async () => {
  await admin.end()
})

async function summaryOf(tx: Tx) {
  const rows = await tx<{ scope_key: string; seller_avg: string | null; n_stores: number; n_sellers: number; min: number; max: number }[]>`
    select s.scope_key, s.seller_avg::text, s.n_stores, s.n_sellers, s.min, s.max
      from price.product_daily_summary s
      join price.product_source_key k on k.product_id = s.product_id
      join price.source_item si on si.id = k.source_item_id
     where si.source_key = 'chamga:1000' and s.obs_date = ${SURVEY_DAY}`
  return new Map(rows.map((r) => [r.scope_key, r]))
}

describe("상품 요약", () => {
  it("정부 화면과 같은 업태별 점포 수와 판매처 2단 평균을 낸다", async () => {
    await inRollback(admin, async (tx) => {
      await tx`delete from price.product_daily_summary`
      expect(await surveyDaysWithoutSummary(tx)).toContain(SURVEY_DAY)
      const result = await recomputeProductSummary(tx, [SURVEY_DAY])
      expect(result.days).toBe(1)

      const s = await summaryOf(tx)
      expect(s.get("national")).toMatchObject({ n_stores: 419 })
      expect(Object.fromEntries(["large_mart", "department", "ssm", "convenience"].map((c) => [c, s.get(`channel:${c}`)?.n_stores]))).toEqual({
        large_mart: 115,
        department: 16,
        ssm: 284,
        convenience: 4,
      })
      // 업태 평균 = 판매처 평균의 평균, 전국 = 업태 평균의 평균 (1,240 + 1,500 + 1,346 + 1,600) / 4 = 1,421.5
      expect(Math.round(Number(s.get("channel:large_mart")!.seller_avg))).toBe(1240)
      expect(Math.round(Number(s.get("channel:ssm")!.seller_avg))).toBe(1346)
      expect(Math.round(Number(s.get("national")!.seller_avg))).toBe(1422)
      expect([...s.keys()].filter((k) => k.startsWith("seller:")).length).toBe(s.get("national")!.n_sellers)
      expect(await surveyDaysWithoutSummary(tx)).not.toContain(SURVEY_DAY)
    })
  })

  it("다시 계산하면 고쳐 쓰는 행이 없고, 없어진 범위의 행은 지운다", async () => {
    await inRollback(admin, async (tx) => {
      await recomputeProductSummary(tx, [SURVEY_DAY])
      expect(await recomputeProductSummary(tx, [SURVEY_DAY])).toMatchObject({ written: 0, removed: 0 })

      await tx`
        insert into price.product_daily_summary (product_id, scope_key, obs_date, n_stores, promo_n, promo_unknown_n, computed_at)
        select product_id, 'seller:999999', obs_date, 1, 0, 0, now() from price.product_daily_summary
         where obs_date = ${SURVEY_DAY} and scope_key = 'national' limit 1`
      expect(await recomputeProductSummary(tx, [SURVEY_DAY])).toMatchObject({ written: 0, removed: 1 })
    })
  })

  it("관측값이 없는 조사일은 건드리지 않는다 (보존 정리로 지운 날의 요약은 남는다)", async () => {
    await inRollback(admin, async (tx) => {
      await recomputeProductSummary(tx, [SURVEY_DAY])
      await tx`update price.product_daily_summary set obs_date = '2026-06-12' where obs_date = ${SURVEY_DAY}`
      const [before] = await tx<{ n: number }[]>`select count(*)::int as n from price.product_daily_summary where obs_date = '2026-06-12'`
      expect(await recomputeProductSummary(tx, ["2026-06-12"])).toEqual({ written: 0, removed: 0, days: 0 })
      const [after] = await tx<{ n: number }[]>`select count(*)::int as n from price.product_daily_summary where obs_date = '2026-06-12'`
      expect(after!.n).toBe(before!.n)
    })
  })
})
