import "server-only"

import postgres from "postgres"

import { assertAdmin } from "@/features/admin-print/server/guard"

import type { DayRow, PartRow, RunRow, Source } from "../lib/status-view"

// 수집 상태 화면의 읽기 (ingest-foundation/05, pipeline 5-3). 수집 기록 표(source_day·ingest_run)는 web_reader가 못 읽어
// ingest_writer(루트 .env INGEST_DATABASE_URL)로 읽기만 한다. 로컬 .env의 이 주소는 운영 DB다. 개발 서버에서만 연다.
// 카탈로그 어드민의 읽기 접속과 같은 방식이다 (기능끼리 가져다 쓰지 않아 따로 둔다).
const globalForIngest = globalThis as typeof globalThis & { ingestStatusSql?: postgres.Sql }

function db(): postgres.Sql {
  assertAdmin()
  if (!globalForIngest.ingestStatusSql) {
    const url = process.env.INGEST_DATABASE_URL
    if (!url) throw new Error("INGEST_DATABASE_URL이 없다. 루트 .env에 넣는다")
    try {
      new URL(url)
    } catch {
      // postgres는 형식이 잘못된 주소를 비밀번호째 오류에 담는다. 주소 없는 오류로 바꾼다
      throw new Error("INGEST_DATABASE_URL의 형식이 잘못됐다")
    }
    globalForIngest.ingestStatusSql = postgres(url, { prepare: false, max: 2, idle_timeout: 20, onnotice: () => {} })
  }
  return globalForIngest.ingestStatusSql
}

export const STATUS_DAYS = 14

export type IngestStatus = {
  today: string
  lastOk: Map<string, string | null>
  days: DayRow[]
  runs: RunRow[]
  parts: PartRow[]
}

// today: KST 오늘 (YYYY-MM-DD)
export async function getIngestStatus(today: string): Promise<IngestStatus> {
  const sql = db()
  const [lastOk, days, runs, parts] = await Promise.all([
    sql<{ source: Source; last_ok: string | null }[]>`
      select s.source, (select max(d.target_date)::text from price.source_day d where d.source = s.source and d.status = 'ok') as last_ok
        from (values ('kamis'), ('ekape'), ('chamga')) s (source)`,
    sql<{ source: Source; day: string; status: DayRow["status"]; row_count: number; attempts: number; correction_count: number }[]>`
      select source, target_date::text as day, status, row_count, attempts, correction_count from price.source_day
       where target_date >= ${today}::date - ${STATUS_DAYS}::int and target_date < ${today}::date`,
    // 최근 14일의 성공하지 못한 실행 (시작 시각 최신순)
    sql<{ id: string; source: RunRow["source"]; job: string; started_at: Date; status: RunRow["status"]; error_code: string | null; calls_used: number }[]>`
      select id, source, job, started_at, status, error_code, calls_used from price.ingest_run
       where status <> 'ok' and started_at >= now() - interval '14 days'
       order by started_at desc limit 30`,
    sql<{ source: Source; day: string; item: string; rows: number; baseline: number | null; status: PartRow["status"] }[]>`
      select source, target_date::text as day, part_key as item, row_count as rows, baseline, status from price.source_day_part
       where status <> 'ok' and target_date >= ${today}::date - ${STATUS_DAYS}::int
       order by target_date desc, part_key limit 200`,
  ])
  return {
    today,
    lastOk: new Map(lastOk.map((r) => [r.source, r.last_ok])),
    days: days.map((r) => ({ source: r.source, day: r.day, status: r.status, rowCount: r.row_count, attempts: r.attempts, correctionCount: r.correction_count })),
    runs: runs.map((r) => ({
      id: Number(r.id),
      source: r.source,
      job: r.job,
      startedAt: r.started_at.toISOString(),
      status: r.status,
      errorCode: r.error_code,
      callsUsed: r.calls_used,
    })),
    parts: parts.map((r) => ({ source: r.source, day: r.day, item: r.item, rows: r.rows, baseline: r.baseline, status: r.status })),
  }
}
