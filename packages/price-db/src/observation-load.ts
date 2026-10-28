// 샘플 테스트 데이터용 관측값 적재 (pipeline.md 3-0 "접속", 3-3 "적재와 정정", 3-9 보관 1).
//   정기 적재: 수집 패키지의 병합(@workspace/price-ingest/load/observation)을 그대로 쓴다
//   백필: 임시 표 COPY → daily_quote → 최근 90일만 observation에 병합. 샘플용 간이 집계다.
//   정식 구현은 수집 패키지의 백필 원본 적재(load-file.ts, daily-quote.ts aggregateStagedQuotes, ingest-foundation/04)
// 둘 다 원본 파일 하나 = 트랜잭션 하나이고, 출처별 advisory lock을 잡는다.
import {
  ensureSourceDays,
  lockSource,
  mergeObservations,
  stageObservations,
  type ObservationRow,
} from "@workspace/price-ingest/load/observation"

import { aggregateDailyQuote } from "./aggregate.ts"
import { transaction, type Sql } from "./db.ts"

export type { ObservationRow }

export type Source = "kamis" | "ekape" | "chamga"

export type MergeResult = { changed: number; corrections: number }

async function markLoaded(tx: Sql, rawObjectId: number): Promise<void> {
  await tx`update price.raw_object set load_status = 'loaded', loaded_at = now() where id = ${rawObjectId}`
}

// 정기 적재: 원본 파일 하나를 트랜잭션 하나로.
export async function loadObservationFile(
  sql: Sql,
  source: Source,
  rawObjectId: number,
  rows: readonly ObservationRow[],
): Promise<MergeResult> {
  return transaction(sql, async (tx) => {
    await lockSource(tx, source)
    await stageObservations(tx, "obs_load", rows)
    const { changed, corrections } = await mergeObservations(tx, source, "obs_load")
    await markLoaded(tx, rawObjectId)
    await tx`drop table obs_load`   // commit 때 사라지지만, 바깥 트랜잭션 안에서 다시 부를 수 있게 지운다
    return { changed, corrections }
  })
}

export type BackfillResult = { dailyQuotes: number; observations: number }

// 백필 묶음의 날은 관측값에 넣지 않는 날(90일 밖)도 받은 날이다. 90일 밖은 여기서 ok와 행 수를 두고,
// 90일 안은 병합(mergeObservations)이 둔다.
async function settleOldBackfillDays(tx: Sql, table: string, today: string): Promise<void> {
  await tx.unsafe(
    `update price.source_day d
        set status = 'ok', row_count = s.n, first_ok_at = coalesce(d.first_ok_at, now()), last_checked_at = now()
       from (select obs_date, count(*)::int as n from ${table} where obs_date < $1::date - 90 group by obs_date) s
      where d.source = 'kamis' and d.target_date = s.obs_date and d.status = 'pending'`,
    [today],
  )
}

// KAMIS 백필 묶음 하나: 임시 표에서 집계를 만들고, 최근 90일에 드는 행만 관측값에 넣는다 (3-9 보관 1).
export async function backfillKamisBundle(
  sql: Sql,
  rawObjectId: number,
  rows: readonly ObservationRow[],
  today: string,
): Promise<BackfillResult> {
  return transaction(sql, async (tx) => {
    await lockSource(tx, "kamis")
    await stageObservations(tx, "kamis_backfill", rows)
    await tx.unsafe(`create index on kamis_backfill (variety_id, spec_id, obs_date)`)
    const dailyQuotes = await aggregateDailyQuote(tx, "kamis_backfill")
    await ensureSourceDays(tx, "kamis", "kamis_backfill")
    await settleOldBackfillDays(tx, "kamis_backfill", today)
    await tx.unsafe(`delete from kamis_backfill where obs_date < $1::date - 90`, [today])
    const { changed } = await mergeObservations(tx, "kamis", "kamis_backfill")
    await markLoaded(tx, rawObjectId)
    await tx`drop table kamis_backfill`
    return { dailyQuotes, observations: changed }
  })
}
