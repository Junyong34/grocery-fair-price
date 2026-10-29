// 참가격 마스터와 상품 연결 (pipeline 3-2 점포, 3-6 상품, ingest-schedule/06).
// 가격 행은 점포 번호(entpId)와 상품 번호(goodId)만 준다. 이름·업태·용량은 마스터 두 개에 있다.
// 수집은 실행마다 마스터를 먼저 받고 가격을 받는다. 그래도 마스터에 아직 없는 번호가 가격에 오면
// 점포는 위치만, 상품은 임시 이름으로 먼저 만들고 가격을 넣는다. 다음 마스터 적재가 이름·상세를 채운다.
//
// 하지 않는 것 (ingest-schedule 지도 Out of scope): 마스터 변경 감지(이름·용량 바뀜, goodId 재사용, 점포 재등록),
// 사라진 상품 판정, 상품 → 품종 매핑(pending으로만 둔다).
// 판매처 연결(store_seller)은 운영자가 정한 판매처 이름으로 자동으로 한다 (price.assign_store_sellers, ingest-foundation/07).
import type { RejectedRow } from "../adapt/batch.ts"
import type { ChamgaProductRow, ChamgaStoreRow } from "../sources/chamgagyeok.ts"
import type { Tx } from "./db.ts"
import { upsertSourceItems } from "./masters.ts"

// 참가격 API가 주는 첫 조사일. 상품의 첫 출처 키·속성·품종 연결 기간은 여기서 시작한다.
// 그래야 나중에 받은 과거 조사일의 가격도 같은 상품에 이어진다 (3-6).
export const CHAMGA_SINCE = "2026-06-12"

// 식품만 받는다: AL 대분류 신선식품 0301, 가공식품 0302 (chamgagyeok.md 6-1)
export function isFoodProduct(row: Pick<ChamgaProductRow, "goodSmlclsCode">): boolean {
  return row.goodSmlclsCode.startsWith("0301") || row.goodSmlclsCode.startsWith("0302")
}

export function chamgaSourceKey(goodId: string): string {
  return `chamga:${goodId}`
}

// 마스터에 아직 없는 상품의 임시 이름. 상품 마스터가 오면 바뀐다.
export function placeholderProductName(goodId: string): string {
  return `참가격 상품 ${goodId}`
}

// BU 업태 → 우리 업태 (pipeline 3-2 store.channel)
const CHANNEL: Record<string, string> = { LM: "large_mart", DP: "department", SM: "ssm", CS: "convenience" }

export type MasterOutcome = { rows: number; created: number; rejected: RejectedRow[] }

// 판매처 연결 결과. unassigned: 판매처 규칙에 맞지 않아 연결이 없는 점포 수 (0이 아니면 운영자가 판매처를 더한다)
export type SellerOutcome = { assigned: number; unassigned: number }

// 판매처 연결이 없는 점포를 판매처에 잇는다. 마스터로 새 점포가 생긴 뒤 부른다
export async function assignStoreSellers(tx: Tx): Promise<SellerOutcome> {
  const [row] = await tx<{ assigned: string; unassigned: string }[]>`
    select assigned, unassigned from price.assign_store_sellers(${CHAMGA_SINCE}::date)`
  return { assigned: Number(row!.assigned), unassigned: Number(row!.unassigned) }
}

// 점포 마스터: 처음 보는 점포의 위치(obs_place)와 상세(store)를 만든다. 가격으로 위치만 먼저 생긴 점포는 상세를 채운다.
// 이미 상세가 있는 점포는 다시 쓰지 않는다 (변경 감지는 Out of scope).
// 지역(region_code)은 비우고 AR 원천값만 남긴다 (ingest-schedule/05 Answer 2).
export async function loadStoreMaster(tx: Tx, rows: readonly ChamgaStoreRow[]): Promise<MasterOutcome> {
  const rejected: RejectedRow[] = []
  const stores: Record<string, string | number | null>[] = []
  rows.forEach((row, index) => {
    const channel = CHANNEL[row.entpTypeCode]
    if (channel === undefined) {
      rejected.push({ index, reason: "처음 보는 업태 코드다" })
      return
    }
    stores.push({
      code: row.entpId,
      name: row.entpName,
      channel,
      // 편의점은 본사 1곳씩이라 전국 집계에만 넣는다 (chamgagyeok.md 7-2)
      region_scope: channel === "convenience" ? "national_only" : "local",
      area: row.entpAreaCode,
      area_detail: row.areaDetailCode,
      lat: row.xMapCoord === undefined ? null : Number(row.xMapCoord), // x가 위도다
      lng: row.yMapCoord === undefined ? null : Number(row.yMapCoord),
      road: row.roadAddrBasic ?? null,
      jibun: row.plmkAddrBasic,
    })
  })
  if (stores.length === 0) return { rows: rows.length, created: 0, rejected }

  // 마스터로만 아는 점포는 본 날짜가 없다 (obs_place.first_seen_on null, 3-2)
  await tx`
    insert into price.obs_place (source, kind, scope, source_place_code)
    select 'chamga', 'store', 'store', r.code from jsonb_to_recordset(${tx.json(stores)}) as r (code text)
    on conflict (source, kind, source_place_code) do nothing`
  const created = await tx`
    insert into price.store
      (place_id, name, channel, region_scope, area_code_raw, area_detail_code_raw, lat, lng, road_addr, jibun_addr, status, lineage_id)
    select p.id, r.name, r.channel, r.region_scope, r.area, r.area_detail, r.lat, r.lng, r.road, r.jibun, 'active', p.id
      from jsonb_to_recordset(${tx.json(stores)})
           as r (code text, name text, channel text, region_scope text, area text, area_detail text,
                 lat numeric, lng numeric, road text, jibun text)
      join price.obs_place p on p.source = 'chamga' and p.kind = 'store' and p.source_place_code = r.code
    on conflict (place_id) do nothing`
  return { rows: rows.length, created: created.count, rejected }
}

type ProductSeed = { goodId: string; sourceItemId: number; name: string; registeredOn: string }

// 출처 키에 상품이 없으면 만든다: 상품, 출처 키 연결, 품종 연결(pending). 상품 ID는 우리가 발급한다 (3-6).
// 돌려주는 값: 새로 만든 상품 수
async function ensureProducts(tx: Tx, seeds: readonly ProductSeed[]): Promise<number> {
  const known = await tx<{ source_item_id: number }[]>`
    select distinct source_item_id from price.product_source_key
     where source_item_id in (select (jsonb_array_elements_text(${tx.json(seeds.map((s) => s.sourceItemId))}))::int)`
  const has = new Set(known.map((row) => row.source_item_id))
  let created = 0
  for (const seed of seeds) {
    if (has.has(seed.sourceItemId)) continue
    // 가공식품의 품종 단위가 정해지기 전이라 pending (3-6, p3-variety-catalog/01)
    await tx`
      with p as (
        insert into price.product (name, status, registered_on)
        values (${seed.name}, 'surveyed', ${seed.registeredOn})
        returning id
      ), k as (
        insert into price.product_source_key (source_item_id, valid_from, product_id)
        select ${seed.sourceItemId}, ${CHAMGA_SINCE}, id from p
      )
      insert into price.product_variety_map (product_id, valid_from, status, origin)
      select id, ${CHAMGA_SINCE}, 'pending', 'al_rule' from p`
    has.add(seed.sourceItemId)
    created += 1
  }
  return created
}

// 상품 마스터: 식품 상품마다 상품을 두고(없으면 만들고), 속성 이력이 없는 상품에 이름·용량·분류를 채운다.
// 가격으로 임시 이름이 붙은 상품은 여기서 제 이름을 얻는다. 생활용품은 받지 않는다 (chamgagyeok.md 6-1).
export async function loadProductMaster(
  tx: Tx,
  rows: readonly ChamgaProductRow[],
  input: { collectedOn: string; rawObjectId: number },
): Promise<MasterOutcome> {
  const food = rows.filter(isFoodProduct)
  if (food.length === 0) return { rows: rows.length, created: 0, rejected: [] }

  const ids = await upsertSourceItems(
    tx,
    "chamga",
    food.map((row) => ({
      sourceKey: chamgaSourceKey(row.goodId),
      keyParts: { goodId: row.goodId },
      label: row.goodName,
      seenOn: input.collectedOn,
    })),
  )
  const created = await ensureProducts(
    tx,
    food.map((row) => ({
      goodId: row.goodId,
      sourceItemId: ids.get(chamgaSourceKey(row.goodId))!,
      name: row.goodName,
      registeredOn: input.collectedOn,
    })),
  )

  const attrs = food.map((row) => ({
    source_item_id: ids.get(chamgaSourceKey(row.goodId))!,
    name: row.goodName,
    total_qty: Number(row.goodTotalCnt),
    total_unit: row.goodTotalDivCode,
    al_code: row.goodSmlclsCode,
    maker_code: row.productEntpCode === "" ? null : row.productEntpCode,
    detail_mean: row.detailMean ?? null,
  }))
  // 속성 이력이 아직 없는 상품만 (처음 받은 마스터, 또는 가격으로 먼저 생긴 상품). 바뀐 속성의 새 이력은 Out of scope.
  await tx`
    with a as (
      select k.product_id, r.*
        from jsonb_to_recordset(${tx.json(attrs)})
             as r (source_item_id int, name text, total_qty numeric, total_unit text, al_code text, maker_code text, detail_mean text)
        join price.product_source_key k on k.source_item_id = r.source_item_id and k.valid_to is null
       where not exists (select 1 from price.product_attr_history h where h.product_id = k.product_id)
    ), h as (
      insert into price.product_attr_history
        (product_id, valid_from, name, total_qty, total_unit, al_code, maker_code, detail_mean, raw_object_id)
      select product_id, ${CHAMGA_SINCE}, name, total_qty, total_unit, al_code, maker_code, detail_mean, ${input.rawObjectId}
        from a
    )
    update price.product p set name = a.name from a where p.id = a.product_id and p.name is distinct from a.name`
  return { rows: rows.length, created, rejected: [] }
}

export type PricedProduct = { goodId: string; sourceItemId: number; obsDate: string }

// 가격 행의 상품 번호 → 우리 상품 ID. 마스터에 아직 없는 상품은 임시 이름으로 만든다.
// 가격이 처음·마지막으로 관측된 조사일(first_price_on·last_price_on)을 넓힌다.
// 돌려주는 값: `${sourceItemId}|${obsDate}` → product_id. 그 조사일에 유효한 연결이 없으면 빠진다 (행 거부).
export async function resolvePricedProducts(
  tx: Tx,
  priced: readonly PricedProduct[],
  collectedOn: string,
): Promise<Map<string, number>> {
  if (priced.length === 0) return new Map()
  const seeds = [...new Map(priced.map((p) => [p.sourceItemId, p])).values()].map((p) => ({
    goodId: p.goodId,
    sourceItemId: p.sourceItemId,
    name: placeholderProductName(p.goodId),
    registeredOn: collectedOn,
  }))
  await ensureProducts(tx, seeds)

  const pairs = [...new Map(priced.map((p) => [`${p.sourceItemId}|${p.obsDate}`, p])).values()].map((p) => ({
    source_item_id: p.sourceItemId,
    obs_date: p.obsDate,
  }))
  const found = await tx<{ source_item_id: number; obs_date: string; product_id: number }[]>`
    select r.source_item_id, r.obs_date::text as obs_date, k.product_id
      from jsonb_to_recordset(${tx.json(pairs)}) as r (source_item_id int, obs_date date)
      join price.product_source_key k
        on k.source_item_id = r.source_item_id and daterange(k.valid_from, k.valid_to) @> r.obs_date`

  // 첫·마지막 가격 조사일은 넓어질 때만 고친다 (3-6 "last_price_on은 … 조사일일 때만 고친다")
  await tx`
    update price.product p
       set first_price_on = least(coalesce(p.first_price_on, x.first_on), x.first_on),
           last_price_on = greatest(coalesce(p.last_price_on, x.last_on), x.last_on)
      from (select product_id, min(obs_date) as first_on, max(obs_date) as last_on
              from jsonb_to_recordset(${tx.json(found)}) as f (product_id int, obs_date date)
             group by product_id) x
     where p.id = x.product_id
       and (p.first_price_on is null or p.first_price_on > x.first_on or p.last_price_on < x.last_on)`

  return new Map(found.map((row) => [`${row.source_item_id}|${row.obs_date}`, row.product_id]))
}
