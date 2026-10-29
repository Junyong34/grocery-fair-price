// 참가격 원본 적재 (ingest-schedule/06, pipeline 3-2 점포·3-6 상품).
// price-db 샘플 데이터와 겹치지 않게 상품 번호는 9000000+, 점포 번호는 앞에 77을 붙여 쓴다. 모두 롤백 묶음 안이다.
import { randomUUID } from "node:crypto"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { ADAPTER_VERSION } from "../../src/adapt/draft.ts"
import { CHAMGA_SINCE, placeholderProductName } from "../../src/load/chamga.ts"
import type { Sql, Tx } from "../../src/load/db.ts"
import { registerPending, registerRun } from "../../src/load/ledger.ts"
import { loadRawFile, type LoadOutcome } from "../../src/load/load-file.ts"
import { buildRawFile, type Json, type RawFile } from "../../src/load/raw-file.ts"
import {
  CHAMGA_ENDPOINT,
  parseChamgaPrice,
  parseChamgaProduct,
  parseChamgaStore,
  type ChamgaPriceRow,
} from "../../src/sources/chamgagyeok.ts"
import { readSampleText } from "../helpers.ts"
import { connectLocalIngest, inRollback } from "./local.ts"

const FETCHED_AT = "2026-10-22T22:00:05.000Z"
const goodId = (id: string) => String(9_000_000 + Number(id))
const entpId = (id: string) => `77${id}`

const stores = parseChamgaStore(200, readSampleText("chamgagyeok/store-all.xml")).map((row) => ({ ...row, entpId: entpId(row.entpId) }))
const products = parseChamgaProduct(200, readSampleText("chamgagyeok/product-all.xml")).map((row) => ({
  ...row,
  goodId: goodId(row.goodId),
}))
const moved = (row: ChamgaPriceRow): ChamgaPriceRow => ({ ...row, goodId: goodId(row.goodId), entpId: entpId(row.entpId) })
const pricesByGood = parseChamgaPrice(200, readSampleText("chamgagyeok/price-by-good-1000.xml")).map(moved)
const SURVEY_DAY = "2026-09-25"
const GOOD_1000 = goodId("1000")

let sql: Sql

beforeAll(async () => {
  sql = await connectLocalIngest()
})

afterAll(async () => {
  await sql.end()
})

function chamgaFile(endpoint: string, rows: readonly object[], fetchedAt = FETCHED_AT): RawFile {
  const isPrice = endpoint === CHAMGA_ENDPOINT.price
  return buildRawFile(
    {
      source: "chamga",
      endpoint,
      job: isPrice ? "daily" : "master",
      ingestRunId: null,
      runStartedAt: "2026-10-22T22:00:00.000Z",
      fetchedAt,
      requests: [{ endpoint, params: {}, httpStatus: 200, resultCode: "00", rowCount: rows.length }],
      targetFrom: isPrice ? SURVEY_DAY : null,
      targetTo: isPrice ? SURVEY_DAY : null,
      contractBaseline: "baseline:test",
      adapterVersion: ADAPTER_VERSION,
    },
    rows as unknown as Json[],
  )
}

// 원본을 pending_load로 기록한 뒤 적재한다
async function load(tx: Tx, file: RawFile): Promise<LoadOutcome> {
  const runId = await registerRun(tx, { source: "chamga", job: file.header.job, callBudget: 10 })
  const storagePath = `raw/chamga/test/${randomUUID()}.ndjson.gz`
  await registerPending(tx, {
    storagePath,
    header: { ...file.header, ingestRunId: runId },
    contentSha256: file.contentSha256,
    bytesGz: file.bytes.length,
    ingestRunId: runId,
  })
  const [row] = await tx<{ id: string }[]>`select id from price.raw_object where storage_path = ${storagePath}`
  return loadRawFile(tx, Number(row!.id), file)
}

async function productOf(tx: Tx, id: string) {
  const [row] = await tx<{ id: number; name: string; first_price_on: string | null; last_price_on: string | null; attrs: number }[]>`
    select p.id, p.name, p.first_price_on::text, p.last_price_on::text,
           (select count(*)::int from price.product_attr_history h where h.product_id = p.id) as attrs
      from price.product p
      join price.product_source_key k on k.product_id = p.id
      join price.source_item s on s.id = k.source_item_id
     where s.source_key = ${`chamga:${id}`}`
  return row
}

describe("마스터를 먼저, 가격을 나중에 받는다 (정상 순서)", () => {
  it("점포·식품 상품을 만들고, 가격은 상품 ID와 점포 위치를 가리킨다", async () => {
    await inRollback(sql, async (tx) => {
      const store = await load(tx, chamgaFile(CHAMGA_ENDPOINT.store, stores))
      expect(store).toMatchObject({ status: "loaded", createdMasters: stores.length })
      const [scope] = await tx<{ national_only: number }[]>`
        select count(*)::int as national_only from price.store s join price.obs_place p on p.id = s.place_id
         where p.source_place_code like '77%' and s.region_scope = 'national_only'`
      expect(scope?.national_only).toBe(4) // 편의점 본사 4곳 (chamgagyeok.md 7-2)

      const product = await load(tx, chamgaFile(CHAMGA_ENDPOINT.product, products))
      expect(product).toMatchObject({ status: "loaded", createdMasters: 457 }) // 식품만 (chamgagyeok.md 6-1)
      const sample = products.find((p) => p.goodId === GOOD_1000)!
      expect(await productOf(tx, GOOD_1000)).toMatchObject({ name: sample.goodName, attrs: 1, first_price_on: null })

      // 참가격 원천 키는 품종 매핑(source_code_map)을 만들지 않는다. 상품 → 품종은 pending
      const [maps] = await tx<{ code_map: number; variety_map: number }[]>`
        select (select count(*)::int from price.source_code_map m join price.source_item s on s.id = m.source_item_id
                 where s.source_key ~ '^chamga:9[0-9]{6}$') as code_map,
               (select count(*)::int from price.product_variety_map v join price.product_source_key k on k.product_id = v.product_id
                  join price.source_item s on s.id = k.source_item_id
                 where s.source_key ~ '^chamga:9[0-9]{6}$' and v.status = 'pending' and v.valid_from = ${CHAMGA_SINCE}) as variety_map`
      expect(maps).toEqual({ code_map: 0, variety_map: 457 })

      const price = await load(tx, chamgaFile(CHAMGA_ENDPOINT.price, pricesByGood))
      expect(price).toMatchObject({ status: "loaded", observations: { inserted: pricesByGood.length } })
      const [obs] = await tx<{ n: number; kinds: string[]; products: number; without_store: number }[]>`
        select count(*)::int as n, array_agg(distinct o.obs_kind) as kinds, count(distinct o.product_id)::int as products,
               count(*) filter (where not exists (select 1 from price.store st where st.place_id = o.place_id))::int as without_store
          from price.observation o join price.source_item s on s.id = o.source_item_id
         where s.source_key = ${`chamga:${GOOD_1000}`}`
      expect(obs).toEqual({ n: pricesByGood.length, kinds: ["shelf_price"], products: 1, without_store: 0 })
      expect(await productOf(tx, GOOD_1000)).toMatchObject({ first_price_on: SURVEY_DAY, last_price_on: SURVEY_DAY })

      // 같은 가격을 다시 받으면 고쳐 쓰는 행이 없고, 상품도 늘지 않는다
      const again = await load(tx, chamgaFile(CHAMGA_ENDPOINT.price, pricesByGood, "2026-10-23T22:00:05.000Z"))
      expect(again.observations).toEqual({ inserted: 0, changed: 0, corrections: 0 })
      const [count] = await tx<{ n: number }[]>`
        select count(*)::int as n from price.product_source_key k join price.source_item s on s.id = k.source_item_id
         where s.source_key ~ '^chamga:9[0-9]{6}$'`
      expect(count?.n).toBe(457)
    })
  })
})

describe("점포 마스터가 판매처를 잇는다 (ingest-foundation/07)", () => {
  async function sellersOf(tx: Tx) {
    return tx<{ name: string; seller: string | null; channel: string }[]>`
      select st.name, se.name as seller, st.channel
        from price.store st join price.obs_place p on p.id = st.place_id
        left join price.store_seller ss on ss.place_id = st.place_id
        left join price.seller se on se.id = ss.seller_id
       where p.source_place_code like '77%'`
  }

  it("모든 점포가 업태 + 이름 앞부분으로 판매처에 이어지고, 다시 받아도 그대로다", async () => {
    await inRollback(sql, async (tx) => {
      const first = await load(tx, chamgaFile(CHAMGA_ENDPOINT.store, stores))
      expect(first.sellers).toEqual({ assigned: stores.length, unassigned: 0 })
      const rows = await sellersOf(tx)
      expect(rows.filter((r) => r.seller === null)).toEqual([])
      // 이마트24 본사는 편의점이라 이마트(대형마트)로 묶이지 않는다
      expect(rows.find((r) => r.name.startsWith("이마트24"))).toMatchObject({ seller: "이마트24", channel: "convenience" })
      // 농협은 법인 둘로 나뉜다 ('(주)'와 공백을 빼고 맞춘다)
      const nh = rows.filter((r) => r.name.includes("농협"))
      expect(new Set(nh.map((r) => `${r.name.startsWith("(주)농협유통") ? "유통" : "하나로"}:${r.seller}`))).toEqual(
        new Set(["유통:농협유통", "하나로:농협하나로유통"]),
      )

      const again = await load(tx, chamgaFile(CHAMGA_ENDPOINT.store, stores, "2026-10-23T22:00:05.000Z"))
      expect(again.sellers).toEqual({ assigned: 0, unassigned: 0 })
    })
  })

  it("규칙에 맞지 않는 점포는 잇지 않고 미연결로 센다", async () => {
    await inRollback(sql, async (tx) => {
      const unknown = { ...stores.find((s) => s.entpTypeCode === "LM")!, entpId: entpId("999999"), entpName: "새마트강남점" }
      const outcome = await load(tx, chamgaFile(CHAMGA_ENDPOINT.store, [unknown]))
      expect(outcome.sellers).toEqual({ assigned: 0, unassigned: 1 })
    })
  })
})

describe("마스터에 아직 없는 번호가 가격에 온다", () => {
  it("점포는 위치만, 상품은 임시 이름으로 먼저 넣고, 다음 마스터가 이름과 상세를 채운다", async () => {
    await inRollback(sql, async (tx) => {
      const price = await load(tx, chamgaFile(CHAMGA_ENDPOINT.price, pricesByGood))
      expect(price.observations.inserted).toBe(pricesByGood.length)
      const before = await productOf(tx, GOOD_1000)
      expect(before).toMatchObject({ name: placeholderProductName(GOOD_1000), attrs: 0, first_price_on: SURVEY_DAY })
      const [places] = await tx<{ places: number; stores: number; seen: number }[]>`
        select count(*)::int as places, count(st.place_id)::int as stores, count(p.first_seen_on)::int as seen
          from price.obs_place p left join price.store st on st.place_id = p.id
         where p.source = 'chamga' and p.source_place_code like '77%'`
      expect(places).toEqual({ places: pricesByGood.length, stores: 0, seen: pricesByGood.length })

      await load(tx, chamgaFile(CHAMGA_ENDPOINT.product, products, "2026-10-23T22:00:00.000Z"))
      await load(tx, chamgaFile(CHAMGA_ENDPOINT.store, stores, "2026-10-23T22:00:01.000Z"))
      const after = await productOf(tx, GOOD_1000)
      expect(after).toMatchObject({ id: before!.id, name: products.find((p) => p.goodId === GOOD_1000)!.goodName, attrs: 1 })
      const [filled] = await tx<{ without_store: number; seen_kept: number }[]>`
        select count(*) filter (where st.place_id is null)::int as without_store,
               count(*) filter (where p.first_seen_on = ${SURVEY_DAY})::int as seen_kept
          from price.obs_place p left join price.store st on st.place_id = p.id
         where p.source = 'chamga' and p.source_place_code in (select jsonb_array_elements_text(${tx.json(pricesByGood.map((r) => r.entpId))}))`
      expect(filled).toEqual({ without_store: 0, seen_kept: pricesByGood.length })
    })
  })
})

describe("가격 행의 행사·거부", () => {
  it("할인·1+1 표시를 남기고, 1+1은 확인 전 표시를 붙인다. 필드가 없으면 모름(null)이다", async () => {
    const [first, second, ...rest] = pricesByGood
    const rows: ChamgaPriceRow[] = [
      { ...first!, goodDcYn: "Y", goodDcStartDay: "20260920", goodDcEndDay: "20261003", plusoneYn: "N" },
      { ...second!, goodDcYn: "N", plusoneYn: "Y" },
      ...rest,
    ]
    await inRollback(sql, async (tx) => {
      await load(tx, chamgaFile(CHAMGA_ENDPOINT.price, rows))
      const promo = await tx<{ entp: string; d: boolean | null; one: boolean | null; from: string | null; flags: string[] | null }[]>`
        select p.source_place_code as entp, o.promo_discount as d, o.promo_one_plus_one as one, o.promo_from::text as from, o.flags
          from price.observation o join price.obs_place p on p.id = o.place_id
         where p.source_place_code in (${first!.entpId}, ${second!.entpId}, ${rest[0]!.entpId})
           and o.obs_date = ${SURVEY_DAY} and o.product_id is not null
         order by p.source_place_code = ${first!.entpId} desc, p.source_place_code = ${second!.entpId} desc`
      expect(promo).toEqual([
        { entp: first!.entpId, d: true, one: false, from: "2026-09-20", flags: null },
        { entp: second!.entpId, d: false, one: true, from: null, flags: ["one_plus_one_unverified"] },
        { entp: rest[0]!.entpId, d: null, one: null, from: null, flags: null },
      ])
    })
  })

  it("상품 연결 기간(2026-06-12부터) 밖의 조사일, 가격 0, 형식이 다른 행은 거부하고 나머지는 넣는다", async () => {
    const [first, second, third, ...rest] = pricesByGood
    const rows: unknown[] = [
      { ...first!, goodInspectDay: "20260605" },
      { ...second!, goodPrice: "0" },
      { ...third!, goodPrice: undefined },
      ...rest,
    ]
    await inRollback(sql, async (tx) => {
      const outcome = await load(tx, chamgaFile(CHAMGA_ENDPOINT.price, rows as object[]))
      expect(outcome.status).toBe("partially_rejected")
      expect(outcome.rejected).toEqual([
        { index: 0, reason: "조사일에 유효한 상품 연결이 없다" },
        { index: 1, reason: "가격이 양의 정수가 아니다" },
        { index: 2, reason: "행 형식이 계약과 다르다" },
      ])
      expect(outcome.observations.inserted).toBe(rest.length)
    })
  })
})
