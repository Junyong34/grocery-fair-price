// DB 기록: 실행 기록(ingest_run)과 원본 파일 기록(raw_object)
import type postgres from "postgres"

import type { RawHeader } from "./raw-file.ts"
import type { Sql, Tx } from "./db.ts"
import type { DbSource, RunJob } from "./types.ts"

// 실행 한 번마다 한 줄. 원본 파일은 자기를 받은 실행을 가리킨다 (raw_object.ingest_run_id).
export async function registerRun(
  sql: Sql | Tx,
  input: { source: DbSource | "all"; job: RunJob; callBudget: number; startedAt?: string },
): Promise<number> {
  const [row] = await sql<{ id: string }[]>`
    insert into price.ingest_run (source, job, started_at, status, call_budget)
    values (${input.source}, ${input.job}, ${input.startedAt ?? new Date().toISOString()}, 'running', ${input.callBudget})
    returning id`
  if (!row) throw new Error("실행 기록을 만들지 못했다")
  return Number(row.id)
}

// 원본을 받은 실행의 번호. 헤더에 번호가 있고 그 실행이 있으면 그것을 쓴다.
// 없으면(DB가 안 되어 실행 기록을 못 만들었으면) 헤더로 그 실행을 실패(db_unreachable)로 기록한다.
// 같은 실행(출처·작업·시작 시각)의 원본은 같은 기록을 가리킨다.
export async function runOfRawFile(sql: Sql | Tx, header: RawHeader): Promise<number> {
  if (header.ingestRunId !== null) {
    const found = await sql`select 1 from price.ingest_run where id = ${header.ingestRunId}`
    if (found.length > 0) return header.ingestRunId
  }
  const [existing] = await sql<{ id: string }[]>`
    select id from price.ingest_run
     where source = ${header.source} and job = ${header.job} and started_at = ${header.runStartedAt}
       and error_code = 'db_unreachable'
     order by id limit 1`
  if (existing) return Number(existing.id)
  const [created] = await sql<{ id: string }[]>`
    insert into price.ingest_run (source, job, started_at, finished_at, status, calls_used, call_budget, error_code)
    values (${header.source}, ${header.job}, ${header.runStartedAt}, ${header.fetchedAt}, 'failed',
            ${header.callCount}, ${header.callCount}, 'db_unreachable')
    returning id`
  if (!created) throw new Error("원본을 받은 실행의 기록을 만들지 못했다")
  return Number(created.id)
}

// 주어진 storage_path 중 원본 파일 기록이 이미 있는 것.
// 목록은 JSON 배열로 넘긴다. sql.array는 연결의 첫 쿼리에서 배열로 보내지지 않아
// "op ANY/ALL (array) requires array on right side"로 실패했다 (postgres 3.4.9, 로컬 실측).
export async function registeredPaths(sql: Sql | Tx, paths: readonly string[]): Promise<Set<string>> {
  if (paths.length === 0) return new Set()
  const rows = await sql<{ storage_path: string }[]>`
    select storage_path from price.raw_object
     where storage_path in (select jsonb_array_elements_text(${sql.json([...paths])}))`
  return new Set(rows.map((row) => row.storage_path))
}

export type PendingInput = {
  storagePath: string
  header: RawHeader
  contentSha256: string
  bytesGz: number
  ingestRunId: number
}

// 원본 파일 기록을 pending_load로 남긴다. 이미 있으면 아무것도 하지 않고 false를 돌려준다.
export async function registerPending(sql: Sql | Tx, input: PendingInput): Promise<boolean> {
  const h = input.header
  const rows = await sql<{ id: string }[]>`
    insert into price.raw_object (
      source, endpoint, storage_path, requests, call_count, row_count, bytes_gz, content_sha256,
      target_from, target_to, fetched_at, ingest_run_id, contract_baseline, adapter_version, load_status)
    values (
      ${h.source}, ${h.endpoint}, ${input.storagePath}, ${sql.json(h.requests as unknown as postgres.JSONValue)},
      ${h.callCount}, ${h.rowCount}, ${input.bytesGz}, ${input.contentSha256},
      ${h.targetFrom}, ${h.targetTo}, ${h.fetchedAt}, ${input.ingestRunId},
      ${h.contractBaseline}, ${h.adapterVersion}, 'pending_load')
    on conflict (storage_path) do nothing
    returning id`
  return rows.length > 0
}
