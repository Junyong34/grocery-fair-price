// 참가격 자동 모드: 조사일 하나의 생애 (ingest-schedule/10, chamgagyeok.md 5-4).
// 아직 없음 → 감지 → 들어오는 중 → 행 수 안정·완료 → (월요일 아님) 건너뜀 → 월요일 마지막 받기·닫힘.
// 2096년 날짜, 상품 9000000+, 점포 77+로 실제 데이터와 겹치지 않게 하고 끝에 지운다 (커밋).
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { EXIT, runIngest, type IngestResult } from "../../src/ingest/run.ts"
import type { FetchLike } from "../../src/http.ts"
import type { Sql } from "../../src/load/db.ts"
import { dayPrefix } from "../../src/load/window.ts"
import { parseChamgaPrice } from "../../src/sources/chamgagyeok.ts"
import { FAKE_KEY, readSampleText } from "../helpers.ts"
import { connectLocalAdmin, connectLocalIngest, localStore } from "./local.ts"

const INGEST_URL = "postgresql://ingest_writer:local-only-password@127.0.0.1:55322/postgres"
const F = "2096-10-12" // 금요일
const PREV = "2096-10-05" // 그 전 금요일 (조사 없음)
const store = localStore()
const admin = connectLocalAdmin()
let sql: Sql

beforeAll(async () => {
  sql = await connectLocalIngest()
})

const SHIFT = 9_000_000
const shiftGood = (id: string) => String(Number(id) + (Number(id) >= SHIFT ? 0 : SHIFT))
const STORES = readSampleText("chamgagyeok/store-all.xml").replace(/<entpId>(\d+)<\/entpId>/g, "<entpId>77$1</entpId>")
const PRODUCTS = readSampleText("chamgagyeok/product-all.xml").replace(/<goodId>(\d+)<\/goodId>/g, (_m, id: string) => `<goodId>${shiftGood(id)}</goodId>`)
const EMPTY = readSampleText("chamgagyeok/price-non-survey-day.xml")
const BASE_ROWS = parseChamgaPrice(200, readSampleText("chamgagyeok/price-by-good-1000.xml"))

// 조사일 F에 상품 1000의 가격이 n곳 들어와 있다. 등록 시각은 F+3(월) 12:00 KST
let surveyed = 0
function priceXml(day: string, n: number): string {
  const items = BASE_ROWS.slice(0, n)
    .map(
      (r) =>
        `<iros.openapi.service.vo.goodPriceVO><goodInspectDay>${day.replaceAll("-", "")}</goodInspectDay><entpId>77${r.entpId}</entpId>` +
        `<goodId>${shiftGood(r.goodId)}</goodId><goodPrice>${r.goodPrice}</goodPrice><inputDttm>2096-10-15 12:00:00</inputDttm></iros.openapi.service.vo.goodPriceVO>`,
    )
    .join("")
  return `<?xml version="1.0" encoding="UTF-8"?><response><result>${items}</result><resultCode>00</resultCode><resultMsg>ok</resultMsg></response>`
}

let calls = 0
const fakeChamga: FetchLike = async (url) => {
  calls += 1
  const u = new URL(url)
  if (u.pathname.endsWith("getStoreInfoSvc.do")) return new Response(STORES)
  if (u.pathname.endsWith("getProductInfoSvc.do")) return new Response(PRODUCTS)
  const day = u.searchParams.get("goodInspectDay")!
  const good = Number(u.searchParams.get("goodId")) % SHIFT
  if (day === F.replaceAll("-", "") && good === 1000 && surveyed > 0) return new Response(priceXml(F, surveyed))
  return new Response(EMPTY)
}

// KST 그날 07:00에 돈다
async function runOn(day: string): Promise<IngestResult> {
  calls = 0
  let tick = 0
  const start = Date.parse(`${day}T07:00:00+09:00`)
  return runIngest(
    { source: "chamga" },
    {
      env: { serviceKey: FAKE_KEY, supabaseUrl: "unused", secretKey: "unused", databaseUrl: INGEST_URL },
      store,
      fetch: fakeChamga,
      now: () => new Date(start + 1000 * tick++),
      sleep: async () => {},
      log: () => {},
      chamgaFirstSurveyDay: PREV, // 지난 조사일 채우기는 따로 본다 (test/chamga-schedule.test.ts)
    },
  )
}

async function dayState(day: string) {
  const [row] = await sql<{ status: string; row_count: number; stable_checks: number; closed: boolean }[]>`
    select status, row_count, stable_checks, closed_at is not null as closed
      from price.source_day where source = 'chamga' and target_date = ${day}`
  return row
}

afterAll(async () => {
  const keys = (await Promise.all(["10", "11"].flatMap((m) => Array.from({ length: 31 }, (_, d) => `2096-${m}-${String(d + 1).padStart(2, "0")}`)).map((day) => store.list(dayPrefix("chamga", day))))).flat()
  await store.remove(keys)
  await admin.begin(async (tx) => {
    const items = tx`select id from price.source_item where source = 'chamga' and source_key ~ '^chamga:9[0-9]{6}$'`
    const products = tx`select product_id from price.product_source_key where source_item_id in (${items})`
    await tx`delete from price.observation where source_item_id in (${items})`
    await tx`delete from price.product_variety_map where product_id in (${products})`
    await tx`delete from price.product_attr_history where product_id in (${products})`
    const ids = await tx<{ product_id: number }[]>`select product_id from price.product_source_key where source_item_id in (${items})`
    await tx`delete from price.product_source_key where source_item_id in (${items})`
    await tx`delete from price.product where id in (select (jsonb_array_elements_text(${tx.json(ids.map((r) => r.product_id))}))::int)`
    await tx`delete from price.source_item where source = 'chamga' and source_key ~ '^chamga:9[0-9]{6}$'`
    const places = tx`select id from price.obs_place where source = 'chamga' and source_place_code like '77%'`
    await tx`delete from price.store where place_id in (${places})`
    await tx`delete from price.obs_place where source = 'chamga' and source_place_code like '77%'`
    await tx`delete from price.source_day where source = 'chamga' and target_date >= '2090-01-01'`
    const runs = tx`select id from price.ingest_run where started_at >= '2090-01-01'`
    await tx`delete from price.raw_object where duplicate_of in (select id from price.raw_object where ingest_run_id in (${runs}))`
    await tx`delete from price.raw_object where ingest_run_id in (${runs})`
    await tx`delete from price.ingest_run where started_at >= '2090-01-01'`
  })
  await Promise.all([sql.end(), admin.end()])
})

describe("참가격 조사일의 생애 (커밋, 순서대로)", () => {
  it("토요일: 아직 없다 → 두 금요일 모두 감지 상품 3개만 부르고 아직 안 옴으로 둔다", async () => {
    const result = await runOn("2096-10-13")
    expect(result).toMatchObject({ exitCode: EXIT.ok, uploaded: [] })
    expect(calls).toBe(6)
    expect(await dayState(F)).toMatchObject({ status: "pending", row_count: 0, closed: false })
    expect(await dayState(PREV)).toMatchObject({ status: "pending", closed: false })
  })

  it("월요일: 일부 들어옴 → 감지하고 마스터 + 457개 가격을 받는다. 그 전 금요일은 10일이 지나 빈 조사일로 닫는다", async () => {
    surveyed = 300
    const result = await runOn("2096-10-15")
    expect(result.exitCode).toBe(EXIT.ok)
    expect(result.uploaded).toHaveLength(3) // 점포 마스터, 상품 마스터, F 가격
    expect(calls).toBe(1 + 2 + 457 + 3) // 감지 1(첫 상품에서 찾음), 마스터 2, 가격 457, 그 전 금요일 감지 3
    expect(await dayState(F)).toMatchObject({ status: "ok", row_count: 300, stable_checks: 0, closed: false })
    expect(await dayState(PREV)).toMatchObject({ status: "empty_expected", closed: true })
  })

  it("화요일: 더 들어옴 → 다시 받고, 행 수가 바뀌어 안정 횟수는 0", async () => {
    surveyed = BASE_ROWS.length
    await runOn("2096-10-16")
    expect(await dayState(F)).toMatchObject({ row_count: BASE_ROWS.length, stable_checks: 0 })
  })

  it("수요일: 그대로 → 가격 원본은 중복으로만 기록, 행 수가 같아 안정 1 (마지막 등록이 하루 넘게 지나 완료)", async () => {
    const result = await runOn("2096-10-17")
    expect(result.duplicates.length).toBeGreaterThanOrEqual(1)
    expect(await dayState(F)).toMatchObject({ row_count: BASE_ROWS.length, stable_checks: 1, closed: false })
  })

  it("목요일: 완료됐고 월요일이 아니다 → 아무것도 부르지 않는다", async () => {
    const result = await runOn("2096-10-18")
    expect(result.exitCode).toBe(EXIT.ok)
    expect(calls).toBe(0)
  })

  it("다음 월요일: 마지막으로 한 번 더 받고 닫는다", async () => {
    await runOn("2096-10-22")
    expect(calls).toBe(2 + 457 + 3) // 마스터 2, 가격 457, 새 금요일(10-19) 감지 3
    expect(await dayState(F)).toMatchObject({ closed: true })
  })

  it("닫힌 조사일은 다시 보지 않는다", async () => {
    await runOn("2096-10-23")
    expect(calls).toBe(3) // 10-19 감지만
  })
})
