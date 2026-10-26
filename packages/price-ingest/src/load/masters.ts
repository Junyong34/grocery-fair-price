// 적재가 만드는 마스터: 원천 키(source_item), 관측 위치(obs_place), 조사 시장(market) (pipeline 3-1·3-2).
// 자연키를 DB 번호로 바꾸는 단계다. 적재 트랜잭션 안에서 출처 lock을 잡은 뒤 부른다.
// 지역(region_code)은 비워 둔다. 우리 지역 표와 원천 지역 코드 대응은 운영 DB에 아직 없다 (ingest-schedule Notes).
// 원천 코드(sgg_cd 등)는 위치·시장 행에 남으므로 대응이 생기면 그때 채운다.
import type { Tx } from "./db.ts"
import { isOfficialKamisMarket, kamisMarketType } from "./kamis-market.ts"
import type { DbSource } from "./types.ts"

export type SourceItemInput = {
  sourceKey: string // 'kamis:01-200-224-01-04' (출처 접두사 포함, source_item.source_key)
  keyParts: Record<string, string>
  label: string | null // 이름을 모르면 null (참가격 가격 행). 나중에 이름이 오면 채운다
  seenOn: string
}

type SeenRange = { first: string; last: string }

function widen(range: SeenRange | undefined, day: string): SeenRange {
  if (!range) return { first: day, last: day }
  return { first: day < range.first ? day : range.first, last: day > range.last ? day : range.last }
}

// 원천 키 등록부. 처음 본 키는 넣고, 다시 본 키는 본 날짜 범위가 넓어지거나 비어 있던 이름이 올 때만 고친다 (3-0).
// KAMIS·축평원은 처음 본 키의 매핑을 pending으로 등록한다 (3-1 "원천 키를 처음 본 순간 pending으로 자동 등록").
// 참가격은 상품을 거쳐 품종에 이어지므로 이 매핑을 쓰지 않는다 (3-1, 상품 연결은 chamga.ts).
// 돌려주는 값: source_key → source_item.id
export async function upsertSourceItems(
  tx: Tx,
  source: DbSource,
  items: readonly SourceItemInput[],
): Promise<Map<string, number>> {
  const byKey = new Map<string, SourceItemInput & SeenRange>()
  for (const item of items) {
    const prev = byKey.get(item.sourceKey)
    byKey.set(item.sourceKey, { ...item, ...widen(prev, item.seenOn) })
  }
  const rows = [...byKey.values()].map((item) => ({
    source_key: item.sourceKey,
    key_parts: item.keyParts,
    label: item.label,
    first: item.first,
    last: item.last,
  }))
  if (rows.length === 0) return new Map()

  await tx`
    insert into price.source_item as s (source, source_key, key_parts, label, first_seen_on, last_seen_on)
    select ${source}, r.source_key, r.key_parts, r.label, r.first, r.last
    from jsonb_to_recordset(${tx.json(rows)}) as r (source_key text, key_parts jsonb, label text, first date, last date)
    on conflict (source, source_key) do update
      set first_seen_on = least(s.first_seen_on, excluded.first_seen_on),
          last_seen_on = greatest(s.last_seen_on, excluded.last_seen_on),
          label = coalesce(s.label, excluded.label)
      where s.first_seen_on > excluded.first_seen_on or s.last_seen_on < excluded.last_seen_on
         or (s.label is null and excluded.label is not null)`
  const ids = await tx<{ id: number; source_key: string }[]>`
    select id, source_key from price.source_item
     where source = ${source} and source_key in (select jsonb_array_elements_text(${tx.json(rows.map((r) => r.source_key))}))`

  if (source === "chamga") return new Map(ids.map((row) => [row.source_key, row.id]))
  const idList = tx.json(ids.map((r) => r.id))
  await tx`
    insert into price.source_code_map (source_item_id, valid_from, status)
    select s.id, s.first_seen_on, 'pending'
      from price.source_item s
     where s.id in (select (jsonb_array_elements_text(${idList}))::int)
       and not exists (select 1 from price.source_code_map m where m.source_item_id = s.id)`
  // 처음 본 날보다 오래된 행이 오면(지난 기간 채우기) 첫 매핑을 그날부터로 넓힌다. 그 전 매핑이 없으니
  // "처음부터 이 매핑"이라는 뜻이 그대로다. 안 넓히면 오래된 관측값에 품종이 붙지 않는다 (09)
  await tx`
    update price.source_code_map m set valid_from = s.first_seen_on, updated_at = now()
      from price.source_item s
     where s.id = m.source_item_id and s.id in (select (jsonb_array_elements_text(${idList}))::int)
       and s.first_seen_on < m.valid_from
       and not exists (select 1 from price.source_code_map e where e.source_item_id = m.source_item_id and e.valid_from < m.valid_from)`

  return new Map(ids.map((row) => [row.source_key, row.id]))
}

export type PlaceKind = "store" | "market" | "region_avg"
export type PlaceScope = "store" | "market" | "sigungu" | "sido" | "national"

export type PlaceInput = { kind: PlaceKind; scope: PlaceScope; code: string; seenOn: string }

export function placeKeyOf(kind: PlaceKind, code: string): string {
  return `${kind}:${code}`
}

// 관측 위치. 가격 응답에서 본 날짜는 범위가 넓어질 때만 고친다.
// 참가격 점포는 점포 마스터보다 가격에 먼저 나올 수 있다. 위치만 먼저 만들고 점포 상세(store)는 마스터가 채운다.
// 돌려주는 값: placeKeyOf(kind, code) → obs_place.id
export async function upsertPlaces(
  tx: Tx,
  source: DbSource,
  places: readonly PlaceInput[],
): Promise<Map<string, number>> {
  const byKey = new Map<string, PlaceInput & SeenRange>()
  for (const place of places) {
    const key = placeKeyOf(place.kind, place.code)
    byKey.set(key, { ...place, ...widen(byKey.get(key), place.seenOn) })
  }
  const rows = [...byKey.values()].map((p) => ({ kind: p.kind, scope: p.scope, code: p.code, first: p.first, last: p.last }))
  if (rows.length === 0) return new Map()

  await tx`
    insert into price.obs_place as p (source, kind, scope, source_place_code, first_seen_on, last_seen_on)
    select ${source}, r.kind, r.scope, r.code, r.first, r.last
    from jsonb_to_recordset(${tx.json(rows)}) as r (kind text, scope text, code text, first date, last date)
    on conflict (source, kind, source_place_code) do update
      set first_seen_on = least(p.first_seen_on, excluded.first_seen_on),
          last_seen_on = greatest(p.last_seen_on, excluded.last_seen_on)
      where p.last_seen_on is null or p.first_seen_on > excluded.first_seen_on or p.last_seen_on < excluded.last_seen_on`
  const ids = await tx<{ id: number; kind: PlaceKind; source_place_code: string }[]>`
    select p.id, p.kind, p.source_place_code
      from price.obs_place p
      join jsonb_to_recordset(${tx.json(rows)}) as r (kind text, code text)
        on p.kind = r.kind and p.source_place_code = r.code
     where p.source = ${source}`
  return new Map(ids.map((row) => [placeKeyOf(row.kind, row.source_place_code), row.id]))
}

export type MarketInput = { code: string; name: string; sggCode: string }

// KAMIS 조사 시장. 처음 본 시장만 넣는다. 이름·유형을 운영자가 고쳤을 수 있어 다시 쓰지 않는다.
// 돌려주는 값: 시장 코드 → 시장이 정한 시군구 코드(sgg_code_raw). 행의 sgg_cd가 이와 다르면 그 행은 거부한다 (3-3).
export async function upsertMarkets(
  tx: Tx,
  placeIds: ReadonlyMap<string, number>,
  markets: readonly MarketInput[],
): Promise<Map<string, string>> {
  const unique = [...new Map(markets.map((m) => [m.code, m])).values()]
  if (unique.length === 0) return new Map()
  const rows = unique.map((m) => {
    const placeId = placeIds.get(placeKeyOf("market", m.code))
    if (placeId === undefined) throw new Error(`시장 ${m.code}의 관측 위치가 없다`)
    return {
      place_id: placeId,
      code: m.code,
      name: m.name,
      sgg: m.sggCode,
      type: kamisMarketType(m.code, m.name),
      official: isOfficialKamisMarket(m.code),
    }
  })
  await tx`
    insert into price.market (place_id, name, sgg_code_raw, market_type, type_source, in_official_table)
    select r.place_id, r.name, r.sgg, r.type, 'name_rule', r.official
    from jsonb_to_recordset(${tx.json(rows)}) as r (place_id int, name text, sgg text, type text, official boolean)
    on conflict (place_id) do nothing`
  const stored = await tx<{ code: string; sgg_code_raw: string }[]>`
    select r.code, m.sgg_code_raw
      from price.market m
      join jsonb_to_recordset(${tx.json(rows)}) as r (place_id int, code text) on m.place_id = r.place_id`
  return new Map(stored.map((row) => [row.code, row.sgg_code_raw]))
}
