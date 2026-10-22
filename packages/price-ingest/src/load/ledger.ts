// DB 기록: 실행 기록(ingest_run)과 원본 파일 기록(raw_object)
import type postgres from "postgres"

import type { RawHeader } from "./raw-file.ts"
import type { Sql } from "./db.ts"
import type { DbSource } from "./types.ts"

export type RunJob = "daily" | "recheck" | "reregistration_watch" | "master" | "backfill" | "recompute"

// 실행 한 번마다 한 줄. 원본 파일은 이 실행을 가리킨다 (ingest_run_id).
export async function registerRun(
  sql: Sql,
  input: { source: DbSource | "all"; job: RunJob; callBudget: number },
): Promise<number> {
  const [row] = await sql<{ id: string }[]>`
    insert into price.ingest_run (source, job, started_at, status, call_budget)
    values (${input.source}, ${input.job}, now(), 'running', ${input.callBudget})
    returning id`
  if (!row) throw new Error("실행 기록을 만들지 못했다")
  return Number(row.id)
}

// 주어진 키 중 원본 파일 기록이 이미 있는 것
export async function registeredKeys(sql: Sql, keys: readonly string[]): Promise<Set<string>> {
  if (keys.length === 0) return new Set()
  const rows = await sql<{ storage_path: string }[]>`
    select storage_path from price.raw_object where storage_path = any(${sql.array([...keys])})`
  return new Set(rows.map((row) => row.storage_path))
}

export type PendingInput = {
  source: DbSource
  storageKey: string
  header: RawHeader
  sha256: string
  bytesGz: number
  ingestRunId: number
}

// 원본 파일 기록을 pending_load로 남긴다. 이미 있으면 아무것도 하지 않고 false를 돌려준다.
export async function registerPending(sql: Sql, input: PendingInput): Promise<boolean> {
  const h = input.header
  const rows = await sql<{ id: string }[]>`
    insert into price.raw_object (
      source, endpoint, storage_path, requests, call_count, row_count, bytes_gz, content_sha256,
      target_from, target_to, fetched_at, ingest_run_id, contract_baseline, adapter_version, load_status)
    values (
      ${input.source}, ${h.endpoint}, ${input.storageKey}, ${sql.json(h.requests as postgres.JSONValue)},
      ${h.callCount}, ${h.rowCount}, ${input.bytesGz}, ${input.sha256},
      ${h.targetFrom}, ${h.targetTo}, ${h.fetchedAt}, ${input.ingestRunId},
      ${h.contractBaseline}, ${h.adapterVersion}, 'pending_load')
    on conflict (storage_path) do nothing
    returning id`
  return rows.length > 0
}
