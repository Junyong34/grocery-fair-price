// 원본 파일 하나를 적재한다 (pipeline 3-0 "접속", 3-3 "적재와 정정", 3-7).
// 가격 파일은 한 트랜잭션: 출처 lock → 원천 키·관측 위치·시장(KAMIS)·상품(참가격) → 처음 본 키를 카탈로그대로 매핑
// → 임시 표 COPY → 품종·기준 단위 가격(variety.ts) → 정정·병합 → (축평원) 평년 행 → raw_object 상태.
// 참가격 마스터 파일(점포·상품)은 마스터만 채운다 (chamga.ts).
// 실패하면 파일 하나만 되돌아가고 raw_object는 pending_load로 남는다. 다음 실행이 다시 적재한다.
// KAMIS 백필 원본(헤더 job = backfill)은 보존 기간(90일) 밖의 날을 관측값에 넣지 않고 임시 표에서 바로 시세 요약으로 낸다
// (pipeline 3-9 보관 1, ingest-foundation/04). 대조가 주운 백필 원본도 이 길로 간다. 1년치가 관측값에 들어가면 DB가 넘친다.
// 축평원 백필 원본은 관측값이 영구라 모두 관측값에 넣고, 90일 밖의 날은 시세 요약도 임시 표에서 함께 낸다.
import { adaptChamgaPriceRow, chamgaPriceRowRejection } from "../adapt/chamga.ts"
import { adaptEkapeRow, ekapeRowRejection } from "../adapt/ekape.ts"
import { adaptKamisRow, kamisRowRejection } from "../adapt/kamis.ts"
import type { ObservationDraft, ReferenceDraft } from "../adapt/draft.ts"
import type { RejectedRow } from "../adapt/batch.ts"
import type { AdaptContext } from "../adapt/mapping.ts"
import { applyMappings } from "../catalog/apply.ts"
import type { CallRecord } from "../http.ts"
import { addDays } from "../ingest/collect.ts"
import {
  CHAMGA_ENDPOINT,
  chamgaPriceRowSchema,
  chamgaProductRowSchema,
  chamgaStoreRowSchema,
  type ChamgaPriceRow,
  type ChamgaProductRow,
  type ChamgaStoreRow,
} from "../sources/chamgagyeok.ts"
import { ekapeRowSchema, type EkapeRow } from "../sources/ekape.ts"
import { kamisRowSchema, type KamisRow } from "../sources/kamis.ts"
import {
  assignStoreSellers,
  chamgaSourceKey,
  loadProductMaster,
  loadStoreMaster,
  resolvePricedProducts,
  type MasterOutcome,
  type SellerOutcome,
} from "./chamga.ts"
import { aggregateStagedQuotes, KAMIS_KEEP_DAYS, type StagedQuoteResult } from "./daily-quote.ts"
import { transaction, type Sql, type Tx } from "./db.ts"
import {
  placeKeyOf,
  upsertMarkets,
  upsertPlaces,
  upsertSourceItems,
  type MarketInput,
  type PlaceInput,
  type SourceItemInput,
} from "./masters.ts"
import { lockSource, mergeObservations, stageObservations, type MergeResult, type ObservationRow } from "./observation.ts"
import type { Json, RawFile } from "./raw-file.ts"
import type { DbSource } from "./types.ts"
import { mapStagedObservations } from "./variety.ts"
import { kstDateOf } from "./window.ts"

// 어댑터에는 매핑을 넘기지 않는다. 품종·기준 단위 가격은 DB 매핑으로 임시 표에서 붙인다 (variety.ts)
const NO_MAPPING: AdaptContext = { mapping: () => undefined }

// 적재할 관측값 하나와 그것을 DB 번호로 바꿀 재료
type PreparedObservation = {
  index: number // 원본 파일의 몇 번째 행인가 (거부 사유에 쓴다)
  draft: ObservationDraft
  sourceKey: string
  placeKey: string
  marketSgg: { code: string; sgg: string } | null // 시장 행이면 시장 코드와 행의 sgg_cd
  goodId: string | null // 참가격 행이면 상품 번호 (상품 ID로 바꾼다)
}

type PreparedReference = { draft: ReferenceDraft; sourceKey: string; placeKey: string }

type Prepared = {
  observations: PreparedObservation[]
  references: PreparedReference[]
  rejected: RejectedRow[]
  items: SourceItemInput[]
  places: PlaceInput[]
  markets: MarketInput[]
}

function emptyPrepared(): Prepared {
  return { observations: [], references: [], rejected: [], items: [], places: [], markets: [] }
}

// 원천 응답 행이 계약(행 스키마)과 다르면 관측값으로 넘기지 않는다 (5-2 "응답 형식이 바뀜": 원본에만 남긴다).
const FORMAT_CHANGED = "행 형식이 계약과 다르다"

function prepareKamis(rows: readonly Json[]): Prepared {
  const out = emptyPrepared()
  rows.forEach((raw, index) => {
    const parsed = kamisRowSchema.safeParse(raw)
    if (!parsed.success) {
      out.rejected.push({ index, reason: FORMAT_CHANGED })
      return
    }
    const row: KamisRow = parsed.data
    const reason = kamisRowRejection(row)
    if (reason !== null) {
      out.rejected.push({ index, reason })
      return
    }

    const draft = adaptKamisRow(row, NO_MAPPING)
    const sourceKey = `kamis:${draft.sourceKey}`
    out.items.push({
      sourceKey,
      keyParts: { se_cd: row.se_cd, ctgry_cd: row.ctgry_cd, item_cd: row.item_cd, vrty_cd: row.vrty_cd, grd_cd: row.grd_cd },
      label: `${row.item_nm}/${row.vrty_nm}/${row.grd_nm}`,
      seenOn: draft.obsDate,
    })
    // 시장 행은 시장 코드가, 축산(시장 없음)은 sgg_cd가 위치다. 축산 sgg_cd는 시도 17곳과 1000 전국이다 (kamis.md 5-4)
    const place: PlaceInput = row.mrkt_cd
      ? { kind: "market", scope: "market", code: row.mrkt_cd, seenOn: draft.obsDate }
      : { kind: "region_avg", scope: row.sgg_cd === "1000" ? "national" : "sido", code: row.sgg_cd, seenOn: draft.obsDate }
    out.places.push(place)
    if (row.mrkt_cd) out.markets.push({ code: row.mrkt_cd, name: row.mrkt_nm ?? row.mrkt_cd, sggCode: row.sgg_cd })
    out.observations.push({
      index,
      draft,
      sourceKey,
      placeKey: placeKeyOf(place.kind, place.code),
      marketSgg: row.mrkt_cd ? { code: row.mrkt_cd, sgg: row.sgg_cd } : null,
      goodId: null,
    })
  })
  return out
}

// 행마다 그 행을 받은 호출. 원본 파일의 행은 호출 순서대로 이어 붙어 있고, 호출 기록에 행 수가 있다.
function callOfRows(requests: readonly CallRecord[], rowCount: number): CallRecord[] {
  const calls = requests.flatMap((request) => Array.from({ length: request.rowCount }, () => request))
  if (calls.length !== rowCount) throw new Error(`호출 기록의 행 수 합 ${calls.length}와 원본 행 수 ${rowCount}가 다르다`)
  return calls
}

const EKAPE_NATIONAL = "national"

function prepareEkape(file: RawFile): Prepared {
  const out = emptyPrepared()
  const calls = callOfRows(file.header.requests, file.rows.length)
  file.rows.forEach((raw, index) => {
    const parsed = ekapeRowSchema.safeParse(raw)
    if (!parsed.success) {
      out.rejected.push({ index, reason: FORMAT_CHANGED })
      return
    }
    const row: EkapeRow = parsed.data
    const request = calls[index]!.params
    const reason = ekapeRowRejection(row, { judgeKind: request.judgeKind ?? "" })
    if (reason !== null) {
      out.rejected.push({ index, reason })
      return
    }

    // 평년 행은 날짜가 없어 요청 기준일(standYmd)을 붙인다 (3-3)
    const draft = adaptEkapeRow(row, { ...NO_MAPPING, requestedYmd: request.standYmd ?? "" })
    const sourceKey = `ekape:${draft.sourceKey}`
    const day = draft.recordKind === "observation" ? draft.obsDate : draft.refDate
    out.items.push({
      sourceKey,
      keyParts: { judgeKind: row.judgeKind, itemCd: row.itemCd, grdNm: row.grdNm },
      label: `${row.judgeKindNm}/${row.itemNm}/${row.grdNm}`,
      seenOn: day,
    })
    out.places.push({ kind: "region_avg", scope: "national", code: EKAPE_NATIONAL, seenOn: day })
    const placeKey = placeKeyOf("region_avg", EKAPE_NATIONAL)
    if (draft.recordKind === "observation") out.observations.push({ index, draft, sourceKey, placeKey, marketSgg: null, goodId: null })
    else out.references.push({ draft, sourceKey, placeKey })
  })
  return out
}

// 참가격 가격 행. 상품 용량은 상품 속성에 있어 관측값에는 두지 않는다 (qty_raw·unit_raw null, 3-3).
function prepareChamgaPrice(rows: readonly Json[]): Prepared {
  const out = emptyPrepared()
  rows.forEach((raw, index) => {
    const parsed = chamgaPriceRowSchema.safeParse(raw)
    if (!parsed.success) {
      out.rejected.push({ index, reason: FORMAT_CHANGED })
      return
    }
    const row: ChamgaPriceRow = parsed.data
    const reason = chamgaPriceRowRejection(row)
    if (reason !== null) {
      out.rejected.push({ index, reason })
      return
    }
    const draft = adaptChamgaPriceRow(row, { ...NO_MAPPING, product: () => undefined })
    const sourceKey = chamgaSourceKey(row.goodId)
    out.items.push({ sourceKey, keyParts: { goodId: row.goodId }, label: null, seenOn: draft.obsDate })
    out.places.push({ kind: "store", scope: "store", code: row.entpId, seenOn: draft.obsDate })
    out.observations.push({
      index,
      draft,
      sourceKey,
      placeKey: placeKeyOf("store", row.entpId),
      marketSgg: null,
      goodId: row.goodId,
    })
  })
  return out
}

function prepare(file: RawFile): Prepared {
  switch (file.header.source) {
    case "kamis":
      return prepareKamis(file.rows)
    case "ekape":
      return prepareEkape(file)
    case "chamga":
      if (file.header.endpoint !== CHAMGA_ENDPOINT.price) throw new Error(`참가격 ${file.header.endpoint}는 가격 파일이 아니다`)
      return prepareChamgaPrice(file.rows)
  }
}

// 마스터 행을 스키마로 거른다. 다른 행은 거부한다.
function parseRows<Row>(
  rows: readonly Json[],
  schema: { safeParse: (value: unknown) => { success: true; data: Row } | { success: false } },
): { parsed: Row[]; rejected: RejectedRow[] } {
  const parsed: Row[] = []
  const rejected: RejectedRow[] = []
  rows.forEach((raw, index) => {
    const result = schema.safeParse(raw)
    if (result.success) parsed.push(result.data)
    else rejected.push({ index, reason: FORMAT_CHANGED })
  })
  return { parsed, rejected }
}

const CHAMGA_MASTER_ENDPOINTS: readonly string[] = [CHAMGA_ENDPOINT.store, CHAMGA_ENDPOINT.product]

function toRow(
  item: PreparedObservation,
  ids: { sourceItem: ReadonlyMap<string, number>; place: ReadonlyMap<string, number> },
  file: RawFile,
  rawObjectId: number,
  productId: number | null,
): ObservationRow {
  const { draft } = item
  const sourceItemId = ids.sourceItem.get(item.sourceKey)
  const placeId = ids.place.get(item.placeKey)
  if (sourceItemId === undefined || placeId === undefined) throw new Error(`행 ${item.index}의 원천 키나 위치 번호가 없다`)
  return {
    source_item_id: sourceItemId,
    obs_date: draft.obsDate,
    place_id: placeId,
    price_tier: draft.priceTier,
    obs_kind: draft.obsKind,
    product_id: productId,
    variety_id: null,
    spec_id: null,
    price_raw: draft.priceRaw,
    qty_raw: draft.qtyRaw,
    unit_raw: draft.unitRaw,
    price_per_base: null,
    unit_rule_id: null,
    promo_discount: draft.promo.discount,
    promo_one_plus_one: draft.promo.onePlusOne,
    promo_from: draft.promo.from,
    promo_to: draft.promo.to,
    flags: draft.flags.length > 0 ? draft.flags : null,
    source_registered_at: draft.sourceRegisteredAt,
    first_seen_at: file.header.fetchedAt,
    raw_object_id: rawObjectId,
  }
}

// 같은 관측값 키가 한 파일에 두 번 있으면 뒤의 것을 쓴다. 병합 한 번에 같은 행을 두 번 고칠 수 없다.
function lastByKey(rows: readonly ObservationRow[]): ObservationRow[] {
  return [...new Map(rows.map((row) => [`${row.source_item_id}|${row.obs_date}|${row.place_id}`, row])).values()]
}

type PlaceIds = { sourceItem: ReadonlyMap<string, number>; place: ReadonlyMap<string, number> }

// 준비한 행을 DB 번호로 바꾼다: 원천 키·위치(없으면 만든다), 시장 시군구 검사, 참가격 상품 ID.
// 관측값 표는 건드리지 않는다. 적재(loadRawFile)와 원본에서 다시 계산(stageRawPriceFiles)이 함께 쓴다
async function observationRowsOf(
  tx: Tx,
  source: DbSource,
  rawObjectId: number,
  file: RawFile,
  prepared: Prepared,
): Promise<{ ids: PlaceIds; rows: ObservationRow[]; rejected: RejectedRow[] }> {
  const ids = {
    sourceItem: await upsertSourceItems(tx, source, prepared.items),
    place: await upsertPlaces(tx, source, prepared.places),
  }
  const rejected = [...prepared.rejected]

  // 시장의 sgg_cd는 시장이 정한다. 처음 본 값과 다른 행은 거부하고 경보 대상으로 남긴다 (3-3).
  const marketSgg = await upsertMarkets(tx, ids.place, prepared.markets)
  let accepted = prepared.observations.filter((item) => {
    if (item.marketSgg === null || marketSgg.get(item.marketSgg.code) === item.marketSgg.sgg) return true
    rejected.push({ index: item.index, reason: "시장의 시군구 코드가 처음 본 값과 다르다" })
    return false
  })

  // 참가격: 상품 번호 → 상품 ID. 마스터에 없는 상품은 임시 이름으로 만든다 (chamga.ts).
  const productKey = (item: PreparedObservation) => `${ids.sourceItem.get(item.sourceKey)}|${item.draft.obsDate}`
  const priced = accepted.filter((item) => item.goodId !== null)
  const productOf = await resolvePricedProducts(
    tx,
    priced.map((item) => ({ goodId: item.goodId!, sourceItemId: ids.sourceItem.get(item.sourceKey)!, obsDate: item.draft.obsDate })),
    kstDateOf(file.header.fetchedAt),
  )
  accepted = accepted.filter((item) => {
    if (item.goodId === null || productOf.has(productKey(item))) return true
    rejected.push({ index: item.index, reason: "조사일에 유효한 상품 연결이 없다" })
    return false
  })
  const rows = accepted.map((item) => toRow(item, ids, file, rawObjectId, item.goodId === null ? null : productOf.get(productKey(item))!))
  return { ids, rows, rejected }
}

// 참가격 가격 원본 여러 개를 관측값 모양의 임시 표 table에 담는다. 관측값 표는 건드리지 않는다.
// files는 받은 순서대로 준다: 같은 키는 뒤의 것이 남는다 (적재의 병합과 같은 결과). 트랜잭션 안에서 부른다
export async function stageRawPriceFiles(
  tx: Tx,
  table: string,
  files: readonly { rawObjectId: number; file: RawFile }[],
): Promise<number> {
  await lockSource(tx, "chamga")
  const rows: ObservationRow[] = []
  for (const { rawObjectId, file } of files) {
    if (file.header.source !== "chamga") throw new Error(`참가격 원본이 아니다 (${file.header.source})`)
    rows.push(...(await observationRowsOf(tx, "chamga", rawObjectId, file, prepare(file))).rows)
  }
  const staged = lastByKey(rows)
  await stageObservations(tx, table, staged)
  return staged.length
}

async function upsertReferences(
  tx: Tx,
  refs: readonly PreparedReference[],
  ids: PlaceIds,
  file: RawFile,
  rawObjectId: number,
): Promise<number> {
  if (refs.length === 0) return 0
  const rows = [
    ...new Map(
      refs.map((ref) => {
        const row = {
          source_item_id: ids.sourceItem.get(ref.sourceKey),
          place_id: ids.place.get(ref.placeKey),
          ref_date: ref.draft.refDate,
          value_raw: ref.draft.priceRaw,
          unit_raw: ref.draft.unitRaw,
        }
        return [`${row.source_item_id}|${row.ref_date}`, row] as const
      }),
    ).values(),
  ]
  // 관측값처럼 값이 바뀐 행만 고쳐 쓴다 (3-3 "평년 행"). first_seen_at은 처음 넣을 때만.
  const changed = await tx`
    insert into price.reference_observation as r
      (source_item_id, place_id, ref_type, ref_date, value_raw, unit_raw, first_seen_at, raw_object_id)
    select x.source_item_id, x.place_id, 'normal_year', x.ref_date, x.value_raw, x.unit_raw,
           ${file.header.fetchedAt}, ${rawObjectId}
    from jsonb_to_recordset(${tx.json(rows)}) as x (source_item_id int, place_id int, ref_date date, value_raw int, unit_raw text)
    on conflict (source_item_id, place_id, ref_type, ref_date) do update
      set value_raw = excluded.value_raw, unit_raw = excluded.unit_raw,
          raw_object_id = excluded.raw_object_id, revision = r.revision + 1
      where (r.value_raw, r.unit_raw) is distinct from (excluded.value_raw, excluded.unit_raw)`
  return changed.count
}

export type LoadStatus = "loaded" | "partially_rejected" | "rejected"

export type LoadOutcome = {
  rawObjectId: number
  status: LoadStatus
  rejected: RejectedRow[] // 사유에 값은 넣지 않는다
  observations: MergeResult
  references: number // 새로 생기거나 고쳐 쓴 평년 행
  createdMasters: number // 참가격 마스터 파일이 새로 만든 점포·상품
  backfill: StagedQuoteResult | null // 백필 원본이면 임시 표에서 바로 낸 시세 요약
  sellers?: SellerOutcome // 참가격 점포 마스터면 판매처 연결 결과
}

// today: KST 오늘. 백필 원본은 이것으로 보존 기간을 가른다
export type LoadOptions = { today?: string }

function statusOf(total: number, rejected: number): LoadStatus {
  if (rejected === 0) return "loaded"
  return rejected === total ? "rejected" : "partially_rejected"
}

async function markLoaded(tx: Tx, rawObjectId: number, status: LoadStatus, rejected: RejectedRow[]): Promise<void> {
  await tx`
    update price.raw_object
       set load_status = ${status}, rejected_rows = ${rejected.length}, loaded_at = now()
     where id = ${rawObjectId}`
}

const NO_CHANGE: MergeResult = { inserted: 0, changed: 0, corrections: 0 }

// 참가격 마스터 파일 (점포·상품). 관측값은 만들지 않는다.
function loadChamgaMaster(sql: Sql | Tx, rawObjectId: number, file: RawFile): Promise<LoadOutcome> {
  return transaction(sql, async (tx) => {
    await lockSource(tx, "chamga")
    let outcome: MasterOutcome
    let sellers: SellerOutcome | undefined
    if (file.header.endpoint === CHAMGA_ENDPOINT.store) {
      const { parsed, rejected } = parseRows<ChamgaStoreRow>(file.rows, chamgaStoreRowSchema)
      const loaded = await loadStoreMaster(tx, parsed)
      outcome = { ...loaded, rejected: [...rejected, ...loaded.rejected] }
      sellers = await assignStoreSellers(tx)
    } else {
      const { parsed, rejected } = parseRows<ChamgaProductRow>(file.rows, chamgaProductRowSchema)
      const loaded = await loadProductMaster(tx, parsed, { collectedOn: kstDateOf(file.header.fetchedAt), rawObjectId })
      outcome = { ...loaded, rejected: [...rejected, ...loaded.rejected] }
    }
    const status = statusOf(file.rows.length, outcome.rejected.length)
    await markLoaded(tx, rawObjectId, status, outcome.rejected)
    return {
      rawObjectId,
      status,
      rejected: outcome.rejected,
      observations: NO_CHANGE,
      references: 0,
      createdMasters: outcome.created,
      backfill: null,
      ...(sellers && { sellers }),
    }
  })
}

// rawObjectId: 이 파일의 raw_object.id (load_status = pending_load)
export async function loadRawFile(sql: Sql | Tx, rawObjectId: number, file: RawFile, options: LoadOptions = {}): Promise<LoadOutcome> {
  const source: DbSource = file.header.source
  if (source === "chamga" && CHAMGA_MASTER_ENDPOINTS.includes(file.header.endpoint)) {
    return loadChamgaMaster(sql, rawObjectId, file)
  }
  const backfillToday = file.header.job === "backfill" ? options.today : null
  if (backfillToday === undefined) throw new Error("백필 원본은 오늘(KST)을 받아야 적재한다")
  if (backfillToday !== null && source === "chamga") throw new Error("백필 원본 적재는 KAMIS·축평원만 한다 (chamga)")
  // 축평원 관측값은 영구라(3-9) 90일 밖의 날도 관측값에 넣는다. 그날들의 시세 요약은 임시 표에서 함께 낸다
  const keepOldRows = source === "ekape"
  const prepared = prepare(file)

  return transaction(sql, async (tx) => {
    await lockSource(tx, source)
    const { ids, rows, rejected } = await observationRowsOf(tx, source, rawObjectId, file, prepared)

    // 처음 본 원천 키·상품이 카탈로그에 있으면 바로 잇는다. 없으면 pending으로 남아 운영자가 본다 (09)
    await applyMappings(tx, { onLoad: true })

    let observations: MergeResult = NO_CHANGE
    let backfill: StagedQuoteResult | null = backfillToday === null ? null : { written: 0, days: 0 }
    if (rows.length > 0) {
      await stageObservations(tx, "obs_load", lastByKey(rows))
      await mapStagedObservations(tx, "obs_load")
      if (backfillToday !== null) backfill = await aggregateStagedQuotes(tx, "obs_load", backfillToday, { keepRows: keepOldRows })
      observations = await mergeObservations(tx, source, "obs_load", {
        sourceDaysFrom: backfillToday === null ? undefined : addDays(backfillToday, -KAMIS_KEEP_DAYS),
      })
      await tx`drop table obs_load` // commit 때 사라지지만, 바깥 트랜잭션 안에서 다시 부를 수 있게 지운다
    }
    const references = await upsertReferences(tx, prepared.references, ids, file, rawObjectId)

    rejected.sort((a, b) => a.index - b.index)
    const status = statusOf(file.rows.length, rejected.length)
    await markLoaded(tx, rawObjectId, status, rejected)
    return { rawObjectId, status, rejected, observations, references, createdMasters: 0, backfill }
  })
}
