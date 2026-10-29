// 참가격 상품 요약 (ingest-foundation/07, pipeline 3-4). price-db 샘플 데이터(2026-09-25 팔도 왕뚜껑 goodId 1000, 419개 점포)로
// 정부 화면 값과 맞춘다 (gov-price-sites.md 1장: 업태별 점포 수, 판매처 2단 평균). 원본에서 다시 만들기는 로컬 Storage에 원본을 올린다.
// DB 쓰기는 모두 롤백 묶음 안이고, 올린 원본은 끝에 지운다.
import { randomUUID } from "node:crypto"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { ADAPTER_VERSION } from "../../src/adapt/draft.ts"
import type { Sql, Tx } from "../../src/load/db.ts"
import { registerPending, registerRun } from "../../src/load/ledger.ts"
import { loadRawFile } from "../../src/load/load-file.ts"
import {
  checkRawSummary,
  IncompleteRawError,
  rebuildProductSummaryFromRaw,
  recomputeProductSummary,
  surveyDaysWithoutSummary,
} from "../../src/load/product-summary.ts"
import { buildRawFile, callKeyOf, rawObjectKey, storagePathOf, type Json } from "../../src/load/raw-file.ts"
import { CHAMGA_ENDPOINT, parseChamgaPrice, parseChamgaProduct, parseChamgaStore } from "../../src/sources/chamgagyeok.ts"
import { readSampleText } from "../helpers.ts"
import { connectLocalAdmin, connectLocalIngest, inRollback, localStore } from "./local.ts"

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

// ── 원본에서 다시 만들기 ─────────────────────────────────────────────────────
// 로컬 Storage에 원본을 올리고 적재한 뒤, 관측값을 지우고 원본에서 다시 낸다. 상품 9000000+, 점포 77+, 조사일 2096년.
describe("원본에서 다시 만들기", () => {
  const RAW_DAY = "2096-09-28"
  const moved = <T extends { entpId: string }>(row: T) => ({ ...row, entpId: `77${row.entpId}` })
  const stores = parseChamgaStore(200, readSampleText("chamgagyeok/store-all.xml")).map(moved)
  const products = parseChamgaProduct(200, readSampleText("chamgagyeok/product-all.xml")).map((p) => ({ ...p, goodId: `9${p.goodId.padStart(6, "0")}` }))
  const prices = parseChamgaPrice(200, readSampleText("chamgagyeok/price-by-good-1000.xml")).map((r) => ({
    ...moved(r),
    goodId: `9${r.goodId.padStart(6, "0")}`,
    goodInspectDay: RAW_DAY.replaceAll("-", ""),
  }))
  // 두 번째로 받은 원본은 앞 점포 10곳의 가격이 100원 오르고 점포 20곳이 빠져 있다 (늦게 받은 값이 남고, 빠진 행은 앞 원본 값이 남는다)
  const later = prices.slice(20).map((r, i) => (i < 10 ? { ...r, goodPrice: String(Number(r.goodPrice) + 100) } : r))

  const store = localStore()
  const uploaded: string[] = []
  let ingest: Sql

  beforeAll(async () => {
    ingest = await connectLocalIngest()
  })

  afterAll(async () => {
    await store.remove(uploaded)
    await ingest.end()
  })

  async function put(tx: Tx, endpoint: string, rows: readonly object[], fetchedAt: string, label: string) {
    const isPrice = endpoint === CHAMGA_ENDPOINT.price
    const file = buildRawFile(
      {
        source: "chamga",
        endpoint,
        job: isPrice ? "daily" : "master",
        ingestRunId: null,
        runStartedAt: fetchedAt,
        fetchedAt,
        requests: [{ endpoint, params: {}, httpStatus: 200, resultCode: "00", rowCount: rows.length }],
        targetFrom: isPrice ? RAW_DAY : null,
        targetTo: isPrice ? RAW_DAY : null,
        contractBaseline: "baseline:test",
        adapterVersion: ADAPTER_VERSION,
      },
      rows as unknown as Json[],
    )
    const key = rawObjectKey("chamga", RAW_DAY, callKeyOf(`${label}-${randomUUID().slice(0, 8)}`, fetchedAt))
    await store.upload(key, file.bytes)
    uploaded.push(key)
    const runId = await registerRun(tx, { source: "chamga", job: file.header.job, callBudget: 10 })
    const storagePath = storagePathOf(key)
    await registerPending(tx, {
      storagePath,
      header: { ...file.header, ingestRunId: runId },
      contentSha256: file.contentSha256,
      bytesGz: file.bytes.length,
      ingestRunId: runId,
    })
    const [row] = await tx<{ id: string }[]>`select id from price.raw_object where storage_path = ${storagePath}`
    await loadRawFile(tx, Number(row!.id), file)
    return Number(row!.id)
  }

  async function loadAll(tx: Tx) {
    await put(tx, CHAMGA_ENDPOINT.store, stores, "2096-09-30T22:00:00.000Z", "store")
    await put(tx, CHAMGA_ENDPOINT.product, products, "2096-09-30T22:00:01.000Z", "product")
    await put(tx, CHAMGA_ENDPOINT.price, prices, "2096-09-30T22:00:02.000Z", "price")
    return put(tx, CHAMGA_ENDPOINT.price, later, "2096-10-01T22:00:02.000Z", "price")
  }

  const daySummary = (tx: Tx) => tx`
    select product_id, scope_key, min, median, max, median_excl_promo, seller_avg, n_stores, n_sellers, promo_n, promo_unknown_n
      from price.product_daily_summary where obs_date = ${RAW_DAY} order by product_id, scope_key`

  it("관측값으로 낸 요약과 원본으로 낸 요약이 같고, 확인은 DB를 바꾸지 않는다", async () => {
    await inRollback(ingest, async (tx) => {
      await loadAll(tx)
      const check = await checkRawSummary(tx, store, RAW_DAY)
      expect(check).toMatchObject({ files: 2, rows: prices.length, differing: 0, onlyObservation: 0, onlyRaw: 0 })
      expect(check.summaryRows).toBeGreaterThan(5)
      expect(await daySummary(tx)).toEqual([]) // 확인은 되돌린다
    })
  })

  it("관측값을 지운 조사일도 원본에서 지우기 전과 같은 요약을 낸다", async () => {
    await inRollback(ingest, async (tx) => {
      await loadAll(tx)
      await recomputeProductSummary(tx, [RAW_DAY])
      const before = await daySummary(tx)
      const [national] = await tx<{ max: number }[]>`
        select max from price.product_daily_summary where obs_date = ${RAW_DAY} and scope_key = 'national'`
      expect(national!.max).toBe(Math.max(...later.map((r) => Number(r.goodPrice)), ...prices.slice(0, 20).map((r) => Number(r.goodPrice))))

      await tx`delete from price.observation where obs_date = ${RAW_DAY}`
      // 관측값이 없으니 관측값 길은 그날을 건드리지 않는다
      expect(await recomputeProductSummary(tx, [RAW_DAY])).toEqual({ written: 0, removed: 0, days: 0 })
      await tx`update price.product_daily_summary set median = 1 where obs_date = ${RAW_DAY}`
      const rebuilt = await rebuildProductSummaryFromRaw(tx, store, RAW_DAY)
      expect(rebuilt).toMatchObject({ files: 2, rows: prices.length, removed: 0 })
      expect(await daySummary(tx)).toEqual(before)
    })
  })

  it("원본이 하나라도 지워졌으면 바꾸지 않고 멈춘다", async () => {
    await inRollback(ingest, async (tx) => {
      const lastId = await loadAll(tx)
      await recomputeProductSummary(tx, [RAW_DAY])
      const before = await daySummary(tx)
      await tx`update price.raw_object set purged_at = now() where id = ${lastId}`
      await expect(tx.savepoint((sp) => rebuildProductSummaryFromRaw(sp, store, RAW_DAY))).rejects.toBeInstanceOf(IncompleteRawError)
      expect(await daySummary(tx)).toEqual(before)
    })
  })
})
