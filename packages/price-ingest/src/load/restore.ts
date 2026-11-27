// 보존 기간(90일) 밖 KAMIS 재등록을 원본에서 다시 만든다 (pipeline 3-3 "보존 기간이 지난 행이 다시 등록되어 오면" 1~5, ingest-schedule/09).
// 적재(loadRawFile)는 그런 행을 관측값에 넣지 않고 LoadOutcome.outdated로 넘긴다. 수집 실행(run.ts)이 적재 뒤 이것을 부른다.
//   1. 그 출처·조사일을 담은 모든 원본(백필·정기·재등록 감시, 받은 순서)을 Storage에서 읽어 원천 자연키마다 마지막 값을 취한다.
//      이번 원본 바로 전까지의 값이 "이전 값"이다. 값이 같으면(등록 시각만 바뀜) 정정이 아니라 아무것도 남기지 않는다
//   2. 그 원천 키가 그날 집계에 들어가지 않으면(mapped·primary가 아님) not_aggregated로 기록만 한다
//   3. 들어가면 그날 표본 전체(KAMIS는 원본, 축평원은 관측값)를 세션 임시 표에 넣고 정기 수집과 같은 집계를 낸다
//   4. 완전할 때만 daily_quote를 바꾼다 (원본 하나라도 지워졌거나 못 읽었거나, 표본이 줄면 kept)
//   5. 정정 후보마다 observation_revision에 rebuild_result를 남긴다. kept는 경고로 로그에 남는다
import { isCorrection } from "./restore-rules.ts"
import { rebuildStagedQuotes, type QuoteGroup } from "./daily-quote.ts"
import { transaction, type Sql } from "./db.ts"
import { rawFileObservationRows } from "./load-file.ts"
import { lockSource, stageObservations, type ObservationRow } from "./observation.ts"
import { objectKeyOf, parseRawFile, type RawFile } from "./raw-file.ts"
import type { ObjectStore } from "./storage.ts"
import { mapStagedObservations } from "./variety.ts"

export type RestoreResult = {
  unchanged: number // 값이 같아 정정이 아닌 행
  rebuilt: number
  kept: number
  notAggregated: number
  complete: boolean // 필요한 원본을 모두 읽었는가
}

const keyOf = (r: Pick<ObservationRow, "source_item_id" | "obs_date" | "place_id">) => `${r.source_item_id}|${r.obs_date}|${r.place_id}`

type SourceFile = { id: number; storagePath: string; contentSha256: string; purged: boolean }

// 그 조사일들을 담은 KAMIS 원본 (받은 순서). 중복 기록은 Storage에 없고 내용이 duplicate_of와 같아 뺀다
async function filesCovering(sql: Sql, days: readonly string[]): Promise<SourceFile[]> {
  const rows = await sql<{ id: string; storage_path: string; content_sha256: string; purged_at: Date | null }[]>`
    select id, storage_path, content_sha256, purged_at from price.raw_object r
     where r.source = 'kamis' and r.load_status in ('loaded', 'partially_rejected')
       and r.target_from is not null
       and exists (select 1 from jsonb_array_elements_text(${sql.json([...days])}) d
                    where d::date between r.target_from and r.target_to)
     order by r.fetched_at, r.id`
  return rows.map((r) => ({ id: Number(r.id), storagePath: r.storage_path, contentSha256: r.content_sha256, purged: r.purged_at !== null }))
}

export async function restoreOutdatedRows(input: {
  sql: Sql
  store: ObjectStore
  rawObjectId: number // 이번에 적재한 원본 (outdated를 담은 파일)
  rows: readonly ObservationRow[]
  today: string
}): Promise<RestoreResult> {
  const { sql, store, rawObjectId } = input
  const days = [...new Set(input.rows.map((r) => r.obs_date))].sort()
  const daySet = new Set(days)
  const files = await filesCovering(sql, days)
  let complete = files.every((f) => !f.purged)
  const loaded: { id: number; file: RawFile }[] = []
  for (const f of files) {
    if (f.purged) continue
    try {
      const file = parseRawFile(await store.download(objectKeyOf(f.storagePath)))
      if (file.contentSha256 !== f.contentSha256) throw new Error("원본 내용이 기록의 해시와 다르다")
      loaded.push({ id: f.id, file })
    } catch {
      complete = false
    }
  }

  return transaction(sql, async (tx) => {
    await lockSource(tx, "kamis")
    // 1. 원천 자연키마다 받은 순서의 마지막 값. 이번 원본 바로 전 상태가 이전 값이다
    const latest = new Map<string, ObservationRow>()
    let previous = new Map<string, ObservationRow>()
    for (const { id, file } of loaded) {
      if (id === rawObjectId) previous = new Map(latest)
      for (const row of await rawFileObservationRows(tx, id, file)) if (daySet.has(row.obs_date)) latest.set(keyOf(row), row)
    }
    // 이번 원본의 값이 마지막이어야 한다 (뒤에 받은 원본이 이미 있으면 그 값이 남는다)
    for (const row of input.rows) if (!loaded.some((f) => f.id === rawObjectId)) latest.set(keyOf(row), row)

    const candidates = input.rows.filter((row) => isCorrection(previous.get(keyOf(row)), row))
    const result: RestoreResult = { unchanged: input.rows.length - candidates.length, rebuilt: 0, kept: 0, notAggregated: 0, complete }
    if (candidates.length === 0) return result

    // 3. 그날 표본 전체: KAMIS는 원본에서, 축평원은 관측값에서 (영구 보존)
    await stageObservations(tx, "obs_restore", [...latest.values()])
    await tx`
      insert into obs_restore
      select o.* from price.observation o
        join price.source_item si on si.id = o.source_item_id and si.source = 'ekape'
       where o.obs_date in (select (jsonb_array_elements_text(${tx.json(days)}))::date)`
    await mapStagedObservations(tx, "obs_restore")

    // 2. 집계에 들어가는가: 그날 유효한 mapped·primary 매핑이 있고 품종이 붙었다
    const keys = tx.json(candidates.map((r) => ({ source_item_id: r.source_item_id, obs_date: r.obs_date, place_id: r.place_id })))
    const mapped = await tx<{ source_item_id: number; obs_date: string; place_id: number; variety_id: number; spec_id: number }[]>`
      select s.source_item_id, s.obs_date::text, s.place_id, s.variety_id, s.spec_id
        from obs_restore s
        join jsonb_to_recordset(${keys}) as k (source_item_id int, obs_date date, place_id int)
          on (k.source_item_id, k.obs_date, k.place_id) = (s.source_item_id, s.obs_date, s.place_id)
        join price.source_code_map m
          on m.source_item_id = s.source_item_id and m.status = 'mapped' and m.role = 'primary'
         and daterange(m.valid_from, m.valid_to) @> s.obs_date
       where s.variety_id is not null and s.spec_id is not null`
    const groupOf = new Map(mapped.map((m) => [keyOf(m), { variety_id: m.variety_id, spec_id: m.spec_id, obs_date: m.obs_date }]))
    const groups = [...new Map([...groupOf.values()].map((g) => [`${g.variety_id}|${g.spec_id}|${g.obs_date}`, g])).values()]

    // 4. 완전할 때만 바꾼다
    const rebuilt = await rebuildStagedQuotes(tx, "obs_restore", groups as QuoteGroup[], input.today, complete)
    const verdictOf = new Map(rebuilt.map((r) => [`${r.variety_id}|${r.spec_id}|${r.obs_date}`, r]))
    await tx`drop table obs_restore`

    // 5. 정정 후보마다 한 줄. 이전 값은 복원한 원본의 값 (모르면 null)
    const revisions = candidates.map((row) => {
      const group = groupOf.get(keyOf(row))
      const verdict = group && verdictOf.get(`${group.variety_id}|${group.spec_id}|${group.obs_date}`)
      const outcome = verdict === undefined ? "not_aggregated" : verdict.result
      if (outcome === "rebuilt") result.rebuilt += 1
      else if (outcome === "kept") result.kept += 1
      else result.notAggregated += 1
      const prev = previous.get(keyOf(row))
      const promo = (r: ObservationRow | undefined) =>
        r === undefined ? null : { discount: r.promo_discount, one_plus_one: r.promo_one_plus_one, from: r.promo_from, to: r.promo_to }
      return {
        source_item_id: row.source_item_id,
        obs_date: row.obs_date,
        place_id: row.place_id,
        old_price_raw: prev?.price_raw ?? null,
        new_price_raw: row.price_raw,
        old_promo: promo(prev),
        new_promo: promo(row),
        old_registered: prev?.source_registered_at ?? null,
        new_registered: row.source_registered_at,
        rebuild_result: outcome,
      }
    })
    // 관측값이 없어 revision은 그 키의 이력 수 + 1로 매긴다
    await tx`
      insert into price.observation_revision
        (source_item_id, obs_date, place_id, revision, old_price_raw, new_price_raw, old_promo, new_promo,
         old_source_registered_at, new_source_registered_at, rebuild_result, detected_at, raw_object_id)
      select x.source_item_id, x.obs_date, x.place_id,
             1 + (select count(*) from price.observation_revision r
                   where (r.source_item_id, r.obs_date, r.place_id) = (x.source_item_id, x.obs_date, x.place_id)),
             x.old_price_raw, x.new_price_raw, x.old_promo, x.new_promo, x.old_registered, x.new_registered,
             x.rebuild_result, now(), ${rawObjectId}
        from jsonb_to_recordset(${tx.json(revisions)}) as x (
          source_item_id int, obs_date date, place_id int, old_price_raw int, new_price_raw int, old_promo jsonb, new_promo jsonb,
          old_registered timestamptz, new_registered timestamptz, rebuild_result text)`
    // 값이 바뀌어 집계를 바꾼 날의 정정 표시 (그날 source_day가 있으면)
    const changedDays = [...new Set(rebuilt.filter((r) => r.result === "rebuilt" && r.changed).map((r) => r.obs_date))]
    if (changedDays.length > 0) {
      await tx`
        update price.source_day set corrected_at = now(), correction_count = correction_count + 1
         where source = 'kamis' and target_date in (select (jsonb_array_elements_text(${tx.json(changedDays)}))::date)`
    }
    return result
  })
}
