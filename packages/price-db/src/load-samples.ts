// 저장 샘플 응답으로 로컬 DB에 테스트 데이터를 넣는다. 모든 쓰기를 ingest_writer 롤로 한다.
// 순서는 정기 수집과 같다: 수집 실행 → 원본 기록(pending_load) → 마스터 → 관측값 → 재계산.
// 품종 매핑(source_code_map)은 샘플 품종만 아래 표로 정한다. 운영 매핑은 운영자가 한다.
import { recomputeFixture } from "./aggregate.ts"
import { transaction, type Sql } from "./db.ts"
import {
  backfillKamisBundle,
  loadObservationFile,
  type ObservationRow,
  type Source,
} from "./observation-load.ts"
import {
  chamgaDate,
  ekapeRequestDate,
  kamisDate,
  parseChamgaPrices,
  parseChamgaProducts,
  parseChamgaStores,
  parseEkape,
  parseKamis,
  readSample,
  yn,
  type ChamgaPriceRow,
  type EkapeRow,
  type KamisRow,
  type SampleFile,
} from "./samples.ts"

// 샘플을 받은 날(KST). 백필의 "최근 90일"과 상품 등록일의 기준이다.
export const SAMPLE_TODAY = "2026-10-12"

export const KAMIS_BACKFILL_FILE = "kamis/vegetable-baechu-retail-14d.json"
const KAMIS_DAILY_FILES = [
  "kamis/vegetable-baechu-retail.json",
  "kamis/vegetable-aehobak-retail.json",
  "kamis/fruit-sagwa-retail.json",
  "kamis/fish-godeungeo-retail.json",
]
const EKAPE_FILES = [
  "ekape/pork-all-items.xml",
  "ekape/pork-samgyeopsal.xml",
  "ekape/beef-all-items.xml",
  "ekape/beef-deungsim.xml",
  "ekape/beef-import-all-items.xml",
  "ekape/chicken-all-items.xml",
  "ekape/egg-all-items.xml",
  "ekape/milk-all-items.xml",
]
export const CHAMGA_PRICE_FILES = ["chamgagyeok/price-by-good-1000.xml", "chamgagyeok/price-by-entp-100.xml"]
const CHAMGA_PRODUCT_FILE = "chamgagyeok/product-all.xml"
const CHAMGA_STORE_FILE = "chamgagyeok/store-all.xml"

const ENDPOINT: Record<Source, string> = {
  kamis: "perDay/price",
  ekape: "consumerPriceDaily",
  chamga: "getProductPriceInfoSvc",
}

// 샘플 원천 키 → 품종·규격 (시드의 slug). 여기 없는 키는 pending으로 등록된다.
// 고등어(단위 '손')는 환산 기준이 없어 pending으로 둔다 (3-12 #10).
const SAMPLE_MAPPINGS: { key: RegExp; variety: string; spec: string }[] = [
  { key: /^kamis:01-200-211-\d+-04$/, variety: "baechu", spec: "top" },   // 작형마다 품종 코드가 바뀐다
  { key: /^kamis:01-200-224-01-04$/, variety: "aehobak", spec: "top" },
  { key: /^kamis:01-400-411-07-04$/, variety: "sagwa-hongro", spec: "top" },
  { key: /^ekape:4304-27-구분없음$/, variety: "pork-belly-kr", spec: "default" },
  { key: /^ekape:4304-68-구분없음$/, variety: "pork-neck-kr", spec: "default" },
  { key: /^ekape:4301-22-1\+등급$/, variety: "hanwoo-sirloin", spec: "grade-1plus" },
  { key: /^ekape:4301-22-1등급$/, variety: "hanwoo-sirloin", spec: "grade-1" },
  { key: /^ekape:9903-23-일반란$/, variety: "egg", spec: "xl" },
]
const MAPPING_VALID_FROM = "2020-01-01"

// KAMIS sgg_cd 앞 두 자리 → 우리 시도 코드. 광주(24)·전남(36)은 통합 시도 임시 코드로 (3-2).
const KAMIS_SIDO: Record<string, string> = {
  "11": "11", "21": "26", "22": "27", "23": "28", "24": "T1", "25": "30", "26": "31", "27": "36",
  "31": "41", "32": "51", "33": "43", "34": "44", "35": "52", "36": "T1", "37": "47", "38": "48", "39": "50",
}
// 참가격 AR 시도 → 우리 시도 코드. 옛 광주·전남과 통합 코드는 모두 T1.
const CHAMGA_SIDO: Record<string, string> = {
  "020100000": "11", "020200000": "T1", "020300000": "27", "020400000": "30", "020500000": "26",
  "020600000": "31", "020700000": "28", "020800000": "51", "020900000": "41", "021000000": "48",
  "021100000": "47", "021200000": "T1", "021300000": "52", "021400000": "44", "021500000": "43",
  "021600000": "50", "021700000": "36", "021800000": "T1",
}
const CHAMGA_CHANNEL: Record<string, string> = { LM: "large_mart", DP: "department", SM: "ssm", CS: "convenience" }

// 원천 단위 → (기준 단위 종류, 원천 수량에 곱할 값). 모르는 단위는 환산하지 않는다.
const UNIT: Record<string, { base: "g" | "ml" | "ea"; per: number }> = {
  개: { base: "ea", per: 1 },
  포기: { base: "ea", per: 1 },
  kg: { base: "g", per: 1000 },
  "원/100g": { base: "g", per: 100 },
  "원/Kg": { base: "g", per: 1000 },
  "원/30구": { base: "ea", per: 30 },
  "원/1L": { base: "ml", per: 1000 },
}

type Mapping = { variety_id: number; spec_id: number; unit_rule_id: number; base_unit: string; base_unit_qty: number }

export type Context = {
  sql: Sql
  runs: Map<Source, number>
  mappings: Map<number, Mapping> // source_item_id → 대표 매핑
}

function kst(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString().slice(0, 10)
}

function pricePerBase(price: number, qty: number | null, unit: string | null, m: Mapping | undefined) {
  const u = unit ? UNIT[unit] : undefined
  if (!m || !u || !qty || u.base !== m.base_unit) return null
  return Math.round((price / (qty * u.per)) * m.base_unit_qty * 100) / 100
}

export async function startRun(sql: Sql, source: Source, job: "daily" | "recheck" | "backfill" | "master"): Promise<number> {
  const [run] = await sql<{ id: string }[]>`
    insert into price.ingest_run (source, job, started_at, status, call_budget)
    values (${source}, ${job}, now(), 'running', 0) returning id`
  return Number(run!.id)
}

// 원본을 Storage에 올렸다고 보고 pending_load로 기록한다 (3-7 "순서").
export async function recordRawObject(
  sql: Sql,
  runId: number,
  source: Source,
  file: SampleFile,
  endpoint: string,
  rowCount: number,
  target: [string, string] | null,
  suffix = "",
): Promise<number> {
  const day = kst(file.fetchedAt).replaceAll("-", "/")
  const name = file.path.split("/").pop()!.replace(/\.\w+$/, "")
  const [row] = await sql<{ id: string }[]>`
    insert into price.raw_object
      (source, endpoint, storage_path, requests, call_count, row_count, bytes_gz, content_sha256,
       target_from, target_to, fetched_at, ingest_run_id, contract_baseline, adapter_version, load_status)
    values (${source}, ${endpoint}, ${`raw/${source}/${day}/sample-${name}${suffix}.ndjson.gz`},
            ${sql.json({ sample: file.path, request: file.request })}, 1, ${rowCount}, ${file.bytes}, ${file.sha256},
            ${target?.[0] ?? null}, ${target?.[1] ?? null}, ${file.fetchedAt}, ${runId},
            'sample', 'fixture-1', 'pending_load')
    returning id`
  return Number(row!.id)
}

type SourceItemInput = { source: Source; source_key: string; key_parts: Record<string, string>; label: string; seen_on: string }

// 원천 키 등록부. 처음 본 키는 넣고, 다시 본 키는 날짜가 늘 때만 고친다 (3-0).
async function upsertSourceItems(sql: Sql, items: SourceItemInput[]): Promise<Map<string, number>> {
  const byKey = new Map<string, SourceItemInput & { first: string; last: string }>()
  for (const it of items) {
    const prev = byKey.get(it.source_key)
    byKey.set(it.source_key, {
      ...it,
      first: prev && prev.first < it.seen_on ? prev.first : it.seen_on,
      last: prev && prev.last > it.seen_on ? prev.last : it.seen_on,
    })
  }
  const rows = [...byKey.values()]
  await sql`
    insert into price.source_item as s (source, source_key, key_parts, label, first_seen_on, last_seen_on)
    select r.source, r.source_key, r.key_parts, r.label, r.first, r.last
    from jsonb_to_recordset(${sql.json(rows)}) as r (source text, source_key text, key_parts jsonb, label text, first date, last date)
    on conflict (source, source_key) do update
      set first_seen_on = least(s.first_seen_on, excluded.first_seen_on),
          last_seen_on = greatest(s.last_seen_on, excluded.last_seen_on)
      where s.first_seen_on > excluded.first_seen_on or s.last_seen_on < excluded.last_seen_on`
  const ids = await sql<{ id: number; source_key: string }[]>`
    select id, source_key from price.source_item where source_key in ${sql(rows.map((r) => r.source_key))}`
  return new Map(ids.map((r) => [r.source_key, r.id]))
}

// 처음 본 원천 키는 pending으로 등록하고, 샘플 품종은 mapped로 잇는다 (3-1 "원천 키 → 품종·규격").
async function registerMappings(ctx: Context, ids: Map<string, number>): Promise<void> {
  const rows = [...ids].map(([key, id]) => {
    const hit = SAMPLE_MAPPINGS.find((m) => m.key.test(key))
    return { source_item_id: id, variety: hit?.variety ?? null, spec: hit?.spec ?? null }
  })
  await ctx.sql`
    insert into price.source_code_map (source_item_id, valid_from, status, variety_id, spec_id, unit_rule_id, note)
    select r.source_item_id, ${MAPPING_VALID_FROM}::date,
           case when s.id is null then 'pending' else 'mapped' end,
           s.variety_id, s.id, case when s.id is null then null else u.id end,
           case when s.id is null then null else '샘플 테스트 데이터' end
    from jsonb_to_recordset(${ctx.sql.json(rows)}) as r (source_item_id int, variety text, spec text)
    left join price.variety v on v.slug = r.variety
    left join price.spec s on s.variety_id = v.id and s.slug = r.spec
    cross join price.unit_rule u
    where u.rule_code = 'same_unit' and u.version = 1
    on conflict do nothing`
  const mapped = await ctx.sql<(Mapping & { source_item_id: number })[]>`
    select m.source_item_id, m.variety_id, m.spec_id, m.unit_rule_id, v.base_unit, v.base_unit_qty::float8 as base_unit_qty
    from price.source_code_map m join price.variety v on v.id = m.variety_id
    where m.status = 'mapped' and m.valid_to is null and m.source_item_id in ${ctx.sql([...ids.values()])}`
  for (const m of mapped) ctx.mappings.set(m.source_item_id, m)
}

type PlaceInput = {
  source: Source
  kind: "store" | "market" | "region_avg"
  scope: string
  code: string
  region: string | null
  seen_on: string | null
}

// 관측 위치. 가격 응답에서 본 날짜는 늘 때만 고친다.
async function upsertPlaces(sql: Sql, places: PlaceInput[]): Promise<Map<string, number>> {
  const unique = new Map<string, PlaceInput & { first: string | null }>()
  for (const p of places) {
    const k = `${p.kind}:${p.code}`
    const prev = unique.get(k)
    const seen = [prev?.seen_on, p.seen_on].filter((d): d is string => !!d).sort()
    unique.set(k, { ...p, first: seen[0] ?? null, seen_on: seen.at(-1) ?? null })
  }
  const rows = [...unique.values()]
  await sql`
    insert into price.obs_place as p (source, kind, scope, source_place_code, region_code, first_seen_on, last_seen_on)
    select r.source, r.kind, r.scope, r.code, r.region, r.first, r.seen_on
    from jsonb_to_recordset(${sql.json(rows)})
      as r (source text, kind text, scope text, code text, region text, first date, seen_on date)
    on conflict (source, kind, source_place_code) do update
      set first_seen_on = least(p.first_seen_on, excluded.first_seen_on),
          last_seen_on = greatest(p.last_seen_on, excluded.last_seen_on)
      where excluded.last_seen_on is not null
        and (p.last_seen_on is null or p.first_seen_on > excluded.first_seen_on or p.last_seen_on < excluded.last_seen_on)`
  const source = rows[0]!.source
  const ids = await sql<{ id: number; kind: string; source_place_code: string }[]>`
    select id, kind, source_place_code from price.obs_place where source = ${source}`
  return new Map(ids.map((r) => [`${r.kind}:${r.source_place_code}`, r.id]))
}

async function registerRegionCodes(
  sql: Sql,
  source: Source,
  codeClass: string,
  codes: [string, string | null][],
): Promise<void> {
  const rows = [...new Map(codes)].map(([code, region]) => ({ code, region }))
  await sql`
    insert into price.region_code_map (source, code_class, source_region_code, valid_from, region_code)
    select ${source}, ${codeClass}, r.code, ${MAPPING_VALID_FROM}::date, r.region
    from jsonb_to_recordset(${sql.json(rows)}) as r (code text, region text)
    on conflict do nothing`
}

// ── KAMIS ─────────────────────────────────────────────────────────────

function kamisKey(r: KamisRow) {
  return `kamis:${r.se_cd}-${r.ctgry_cd}-${r.item_cd}-${r.vrty_cd}-${r.grd_cd}`
}

function kamisMarketType(name: string) {
  if (/^[A-Z]`?-유통$/.test(name)) return "large_retail"   // 익명 대형유통 (kamis.md 5-1)
  if (/도매/.test(name)) return "wholesale"
  if (/^[A-Z]-생협$/.test(name)) return "eco_channel"
  return "traditional"
}

async function prepareKamis(ctx: Context, file: SampleFile, rawObjectId: number): Promise<ObservationRow[]> {
  const rows = parseKamis(file)
  const ids = await upsertSourceItems(
    ctx.sql,
    rows.map((r) => ({
      source: "kamis",
      source_key: kamisKey(r),
      key_parts: { se_cd: r.se_cd, ctgry_cd: r.ctgry_cd, item_cd: r.item_cd, vrty_cd: r.vrty_cd, grd_cd: r.grd_cd },
      label: `${r.item_nm}/${r.vrty_nm}/${r.grd_nm}`,
      seen_on: kamisDate(r),
    })),
  )
  await registerMappings(ctx, ids)

  const sido = (sgg: string) => (sgg === "1000" ? "00" : (KAMIS_SIDO[sgg.slice(0, 2)] ?? null))
  await registerRegionCodes(ctx.sql, "kamis", "sgg", rows.map((r) => [r.sgg_cd, sido(r.sgg_cd)]))
  const places = await upsertPlaces(
    ctx.sql,
    rows.map((r) =>
      r.mrkt_cd
        ? { source: "kamis", kind: "market", scope: "market", code: r.mrkt_cd, region: sido(r.sgg_cd), seen_on: kamisDate(r) }
        : { source: "kamis", kind: "region_avg", scope: r.sgg_cd === "1000" ? "national" : "sido",
            code: r.sgg_cd, region: sido(r.sgg_cd), seen_on: kamisDate(r) },
    ),
  )
  const markets = [...new Map(rows.filter((r) => r.mrkt_cd).map((r) => [r.mrkt_cd!, r])).values()]
  if (markets.length > 0) {
    await ctx.sql`
      insert into price.market (place_id, name, sgg_code_raw, market_type, type_source, in_official_table)
      select r.place_id, r.name, r.sgg, r.type, 'name_rule', false   -- 코드표 대조는 수집 패키지가 한다
      from jsonb_to_recordset(${ctx.sql.json(
        markets.map((r) => ({ place_id: places.get(`market:${r.mrkt_cd}`), name: r.mrkt_nm, sgg: r.sgg_cd, type: kamisMarketType(r.mrkt_nm!) })),
      )}) as r (place_id int, name text, sgg text, type text)
      on conflict (place_id) do nothing`
  }

  return rows.map((r): ObservationRow => {
    const sourceItemId = ids.get(kamisKey(r))!
    const m = ctx.mappings.get(sourceItemId)
    const price = Number(r.exmn_dd_prc)
    const qty = Number(r.unit_sz)
    return {
      source_item_id: sourceItemId,
      obs_date: kamisDate(r),
      place_id: places.get(r.mrkt_cd ? `market:${r.mrkt_cd}` : `region_avg:${r.sgg_cd}`)!,
      price_tier: r.se_cd === "02" ? "wholesale" : "retail",
      obs_kind: r.mrkt_cd ? "quote_sample" : "quote_aggregate",
      product_id: null,
      variety_id: m?.variety_id ?? null,
      spec_id: m?.spec_id ?? null,
      price_raw: price,
      qty_raw: qty,
      unit_raw: r.unit,
      price_per_base: pricePerBase(price, qty, r.unit, m),
      unit_rule_id: pricePerBase(price, qty, r.unit, m) === null ? null : m!.unit_rule_id,
      promo_discount: null,
      promo_one_plus_one: null,
      promo_from: null,
      promo_to: null,
      flags: null,
      source_registered_at: r.orgnl_reg_dt,
      first_seen_at: file.fetchedAt,
      raw_object_id: rawObjectId,
    }
  })
}

function dateRange(dates: string[]): [string, string] {
  const sorted = [...dates].sort()
  return [sorted[0]!, sorted.at(-1)!]
}

// suffix: 같은 샘플을 다른 원본 파일로 다시 받은 것처럼 기록할 때 (테스트)
export async function prepareKamisFile(ctx: Context, path: string, suffix = "") {
  const file = readSample(path)
  const parsed = parseKamis(file)
  const rawObjectId = await recordRawObject(
    ctx.sql, ctx.runs.get("kamis")!, "kamis", file, ENDPOINT.kamis, parsed.length, dateRange(parsed.map(kamisDate)), suffix,
  )
  return { rawObjectId, rows: await prepareKamis(ctx, file, rawObjectId) }
}

// ── 축평원 ─────────────────────────────────────────────────────────────

function ekapeKey(r: EkapeRow) {
  return `ekape:${r.judgeKind}-${r.itemCd}-${r.grdNm}`
}

async function loadEkapeFile(ctx: Context, path: string): Promise<void> {
  const file = readSample(path)
  const rows = parseEkape(file)
  const requestDate = ekapeRequestDate(file)
  const rawObjectId = await recordRawObject(
    ctx.sql, ctx.runs.get("ekape")!, "ekape", file, ENDPOINT.ekape, rows.length, [requestDate, requestDate],
  )
  const ids = await upsertSourceItems(
    ctx.sql,
    rows.map((r) => ({
      source: "ekape",
      source_key: ekapeKey(r),
      key_parts: { judgeKind: r.judgeKind, itemCd: r.itemCd, grdNm: r.grdNm },
      label: `${r.judgeKindNm}/${r.itemNm}/${r.grdNm}`,
      seen_on: requestDate,
    })),
  )
  await registerMappings(ctx, ids)
  const places = await upsertPlaces(ctx.sql, [
    { source: "ekape", kind: "region_avg", scope: "national", code: "national", region: "00", seen_on: requestDate },
  ])
  const placeId = places.get("region_avg:national")!

  // 평년 행은 관측값이 아니다. 요청 기준일을 붙여 reference_observation에 둔다 (3-3).
  const normal = rows.filter((r) => r.standYmd === "평년")
  await ctx.sql`
    insert into price.reference_observation as r
      (source_item_id, place_id, ref_type, ref_date, value_raw, unit_raw, first_seen_at, raw_object_id)
    select x.source_item_id, ${placeId}, 'normal_year', ${requestDate}::date, x.value_raw, x.unit_raw, ${file.fetchedAt}, ${rawObjectId}
    from jsonb_to_recordset(${ctx.sql.json(
      normal.map((r) => ({ source_item_id: ids.get(ekapeKey(r)), value_raw: Number(r.ntslPrc), unit_raw: r.unit })),
    )}) as x (source_item_id int, value_raw int, unit_raw text)
    on conflict (source_item_id, place_id, ref_type, ref_date) do update
      set value_raw = excluded.value_raw, unit_raw = excluded.unit_raw,
          raw_object_id = excluded.raw_object_id, revision = r.revision + 1
      where (r.value_raw, r.unit_raw) is distinct from (excluded.value_raw, excluded.unit_raw)`

  const today = rows.filter((r) => r.standYmd !== "평년")
  const obs = today.map((r): ObservationRow => {
    const sourceItemId = ids.get(ekapeKey(r))!
    const m = ctx.mappings.get(sourceItemId)
    const price = Number(r.ntslPrc)
    const unit = UNIT[r.unit]
    const perBase = pricePerBase(price, 1, r.unit, m)
    return {
      source_item_id: sourceItemId,
      obs_date: `${r.standYmd.slice(0, 4)}-${r.standYmd.slice(4, 6)}-${r.standYmd.slice(6, 8)}`,
      place_id: placeId,
      price_tier: "retail",
      obs_kind: "quote_aggregate",
      product_id: null,
      variety_id: m?.variety_id ?? null,
      spec_id: m?.spec_id ?? null,
      price_raw: price,
      qty_raw: unit?.per ?? null,
      unit_raw: r.unit,
      price_per_base: perBase,
      unit_rule_id: perBase === null ? null : m!.unit_rule_id,
      promo_discount: null,
      promo_one_plus_one: null,
      promo_from: null,
      promo_to: null,
      flags: m && perBase === null ? ["unit_mismatch"] : null,
      source_registered_at: null,
      first_seen_at: file.fetchedAt,
      raw_object_id: rawObjectId,
    }
  })
  await loadObservationFile(ctx.sql, "ekape", rawObjectId, obs)
}

// ── 참가격 ─────────────────────────────────────────────────────────────

const CHAMGA_SINCE = "2026-06-12"   // API가 주는 첫 조사일. 상품 키·속성의 유효 시작일로 쓴다

async function loadChamgaMasters(ctx: Context, priceRows: ChamgaPriceRow[]): Promise<void> {
  const sql = ctx.sql
  const runId = await startRun(sql, "chamga", "master")

  // 점포 마스터: 630곳 모두 위치로 등록하고, 가격이 온 점포만 본 날짜를 채운다.
  const storeFile = readSample(CHAMGA_STORE_FILE)
  const stores = parseChamgaStores(storeFile)
  await recordRawObject(sql, runId, "chamga", storeFile, "getStoreInfoSvc.do", stores.length, null)
  const seen = new Map(priceRows.map((r) => [r.entpId, chamgaDate(r)]))
  await registerRegionCodes(sql, "chamga", "AR", stores.map((s) => [s.entpAreaCode, CHAMGA_SIDO[s.entpAreaCode] ?? null]))
  const places = await upsertPlaces(
    sql,
    stores.map((s) => ({
      source: "chamga", kind: "store", scope: "store", code: s.entpId,
      region: CHAMGA_SIDO[s.entpAreaCode] ?? null, seen_on: seen.get(s.entpId) ?? null,
    })),
  )
  const storeRows = stores.map((s) => ({
    place_id: places.get(`store:${s.entpId}`)!,
    name: s.entpName,
    channel: CHAMGA_CHANNEL[s.entpTypeCode]!,
    region_scope: s.entpTypeCode === "CS" ? "national_only" : "local",   // 편의점 본사 4곳
    area: s.entpAreaCode,
    area_detail: s.areaDetailCode ?? null,
    region: CHAMGA_SIDO[s.entpAreaCode] ?? null,   // 시군구 코드는 법정동 파일을 들여온 뒤. 지금은 시도까지
    road: s.roadAddrBasic ?? null,
    jibun: s.plmkAddrBasic ?? null,
  }))
  await sql`
    insert into price.store
      (place_id, name, channel, region_scope, area_code_raw, area_detail_code_raw, region_code, road_addr, jibun_addr, status, lineage_id)
    select r.place_id, r.name, r.channel, r.region_scope, r.area, r.area_detail, r.region, r.road, r.jibun, 'active', r.place_id
    from jsonb_to_recordset(${sql.json(storeRows)})
      as r (place_id int, name text, channel text, region_scope text, area text, area_detail text, region text, road text, jibun text)
    on conflict (place_id) do nothing`

  // 판매처: 점포 이름 앞부분이 가장 긴 판매처 이름과 맞으면 잇는다 (운영자 확정을 대신하는 자동 제안).
  await sql`
    insert into price.store_seller (place_id, seller_id, valid_from)
    select distinct on (st.place_id) st.place_id, se.id, ${CHAMGA_SINCE}::date
    from price.store st
    join price.seller se on replace(st.name, ' ', '') like se.name || '%' and se.channel = st.channel
    order by st.place_id, length(se.name) desc
    on conflict do nothing`

  // 상품 마스터: 가격이 온 상품만 상품으로 만든다.
  const productFile = readSample(CHAMGA_PRODUCT_FILE)
  const productRawId = await recordRawObject(
    sql, runId, "chamga", productFile, "getProductInfoSvc.do", 0, null,
  )
  const priced = new Set(priceRows.map((r) => r.goodId))
  const products = parseChamgaProducts(productFile).filter((p) => priced.has(p.goodId))
  const ids = await upsertSourceItems(
    sql,
    products.map((p) => ({
      source: "chamga", source_key: `chamga:${p.goodId}`, key_parts: { goodId: p.goodId },
      label: p.goodName, seen_on: kst(productFile.fetchedAt),
    })),
  )
  const firstPrice = new Map<string, string>()
  for (const r of priceRows) {
    const d = chamgaDate(r)
    if (!firstPrice.has(r.goodId) || firstPrice.get(r.goodId)! > d) firstPrice.set(r.goodId, d)
  }
  // 상품 ID는 우리가 발급한다. 새 출처 키마다 상품·출처 키·속성 이력·품종 연결을 한 줄씩 만든다 (3-6).
  await transaction(sql, async (tx) => {
    for (const p of products) {
      const sourceItemId = ids.get(`chamga:${p.goodId}`)!
      const [known] = await tx`select 1 from price.product_source_key where source_item_id = ${sourceItemId}`
      if (known) continue
      const priceOn = firstPrice.get(p.goodId) ?? null
      const [product] = await tx<{ id: number }[]>`
        insert into price.product (name, status, registered_on, first_price_on, last_price_on)
        values (${p.goodName}, 'surveyed', ${kst(productFile.fetchedAt)}, ${priceOn}, ${priceOn})
        returning id`
      await tx`
        insert into price.product_source_key (source_item_id, valid_from, product_id)
        values (${sourceItemId}, ${CHAMGA_SINCE}, ${product!.id})`
      await tx`
        insert into price.product_attr_history
          (product_id, valid_from, name, total_qty, total_unit, al_code, maker_code, detail_mean, raw_object_id)
        values (${product!.id}, ${CHAMGA_SINCE}, ${p.goodName}, ${Number(p.goodTotalCnt)}, ${p.goodTotalDivCode},
                ${p.goodSmlclsCode}, ${p.productEntpCode ?? null}, ${p.detailMean ?? null}, ${productRawId})`
      // 가공식품 품종 단위가 정해지기 전이라 pending (p3-variety-catalog/01)
      await tx`
        insert into price.product_variety_map (product_id, valid_from, status, origin)
        values (${product!.id}, ${CHAMGA_SINCE}, 'pending', 'al_rule')`
    }
  })
  await sql`update price.raw_object set row_count = ${products.length}, load_status = 'loaded', loaded_at = now()
            where id = ${productRawId}`
  await sql`update price.raw_object set load_status = 'loaded', loaded_at = now()
            where ingest_run_id = ${runId} and load_status = 'pending_load'`
  await finishRun(sql, runId)
}

export async function prepareChamgaFile(ctx: Context, path: string, suffix = "") {
  const file = readSample(path)
  const rows = parseChamgaPrices(file)
  const rawObjectId = await recordRawObject(
    ctx.sql, ctx.runs.get("chamga")!, "chamga", file, ENDPOINT.chamga, rows.length, dateRange(rows.map(chamgaDate)), suffix,
  )
  // 조사일이 유효 기간 안인 출처 키 → 상품 (3-11). 샘플은 조사일이 하루다.
  const day = rows[0] ? chamgaDate(rows[0]) : CHAMGA_SINCE
  const keys = await ctx.sql<{ source_key: string; source_item_id: number; product_id: number }[]>`
    select si.source_key, si.id as source_item_id, k.product_id
    from price.source_item si
    join price.product_source_key k
      on k.source_item_id = si.id and daterange(k.valid_from, k.valid_to) @> ${day}::date
    where si.source = 'chamga'`
  const productOf = new Map(keys.map((k) => [k.source_key, k.product_id]))
  const itemOf = new Map(keys.map((k) => [k.source_key, k.source_item_id]))
  const places = await ctx.sql<{ id: number; source_place_code: string }[]>`
    select id, source_place_code from price.obs_place where source = 'chamga' and kind = 'store'`
  const placeOf = new Map(places.map((p) => [p.source_place_code, p.id]))

  const obs = rows.map((r): ObservationRow => {
    const discount = yn(r.goodDcYn)
    return {
      source_item_id: itemOf.get(`chamga:${r.goodId}`)!,
      obs_date: chamgaDate(r),
      place_id: placeOf.get(r.entpId)!,
      price_tier: "retail",
      obs_kind: "shelf_price",
      product_id: productOf.get(`chamga:${r.goodId}`)!,
      variety_id: null,   // product_variety_map이 pending
      spec_id: null,
      price_raw: Number(r.goodPrice),
      qty_raw: null,
      unit_raw: null,
      price_per_base: null,
      unit_rule_id: null,
      promo_discount: discount,
      promo_one_plus_one: yn(r.plusoneYn),
      promo_from: discount && r.goodDcStartDay ? r.goodDcStartDay : null,
      promo_to: discount && r.goodDcEndDay ? r.goodDcEndDay : null,
      flags: null,
      source_registered_at: `${r.inputDttm.replace(" ", "T")}+09:00`,   // 시간대 표기 없는 KST
      first_seen_at: file.fetchedAt,
      raw_object_id: rawObjectId,
    }
  })
  return { rawObjectId, rows: obs }
}

async function finishRun(sql: Sql, runId: number): Promise<void> {
  await sql`update price.ingest_run set status = 'ok', finished_at = now() where id = ${runId}`
}

export function newContext(sql: Sql): Context {
  return { sql, runs: new Map(), mappings: new Map() }
}

export async function loadSamples(sql: Sql): Promise<void> {
  const ctx = newContext(sql)

  // KAMIS: 배추 14일은 백필 길로, 나머지는 정기 적재 길로. 배추 하루치는 14일과 겹쳐 고쳐 쓰는 행이 없다.
  ctx.runs.set("kamis", await startRun(sql, "kamis", "backfill"))
  const backfill = await prepareKamisFile(ctx, KAMIS_BACKFILL_FILE)
  await backfillKamisBundle(sql, backfill.rawObjectId, backfill.rows, SAMPLE_TODAY)
  await finishRun(sql, ctx.runs.get("kamis")!)
  ctx.runs.set("kamis", await startRun(sql, "kamis", "daily"))
  for (const path of KAMIS_DAILY_FILES) {
    const { rawObjectId, rows } = await prepareKamisFile(ctx, path)
    await loadObservationFile(sql, "kamis", rawObjectId, rows)
  }
  await finishRun(sql, ctx.runs.get("kamis")!)

  ctx.runs.set("ekape", await startRun(sql, "ekape", "daily"))
  for (const path of EKAPE_FILES) await loadEkapeFile(ctx, path)
  await finishRun(sql, ctx.runs.get("ekape")!)

  const priceRows = CHAMGA_PRICE_FILES.flatMap((p) => parseChamgaPrices(readSample(p)))
  await loadChamgaMasters(ctx, priceRows)
  ctx.runs.set("chamga", await startRun(sql, "chamga", "daily"))
  for (const path of CHAMGA_PRICE_FILES) {
    const { rawObjectId, rows } = await prepareChamgaFile(ctx, path)
    await loadObservationFile(sql, "chamga", rawObjectId, rows)
  }
  await finishRun(sql, ctx.runs.get("chamga")!)

  await recomputeFixture(sql)
}
