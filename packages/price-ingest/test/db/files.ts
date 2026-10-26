// DB 테스트가 같이 쓰는 원본 파일 도우미 (load.db.test, variety.db.test)
import { randomUUID } from "node:crypto"

import { ADAPTER_VERSION } from "../../src/adapt/draft.ts"
import type { Sql, Tx } from "../../src/load/db.ts"
import { registerPending, registerRun } from "../../src/load/ledger.ts"
import { buildRawFile, type Json, type RawFile } from "../../src/load/raw-file.ts"
import type { DbSource } from "../../src/load/types.ts"
import { KAMIS_ENDPOINT, parseKamisPerDay, type KamisRow } from "../../src/sources/kamis.ts"
import { readSampleText } from "../helpers.ts"

const KAMIS_SAMPLE = "kamis/vegetable-baechu-retail-14d.json"
export const FETCHED_AT = "2026-10-22T21:30:05.000Z"

export function kamisSample(year: string, edit?: (row: KamisRow) => void): KamisRow[] {
  return parseKamisPerDay(200, readSampleText(KAMIS_SAMPLE)).map((row) => {
    const moved = {
      ...row,
      exmn_ymd: year + row.exmn_ymd.slice(4),
      orgnl_reg_dt: row.orgnl_reg_dt && year + row.orgnl_reg_dt.slice(4),
    }
    edit?.(moved)
    return moved
  })
}

export function kamisFile(rows: readonly KamisRow[], ingestRunId: number | null, fetchedAt = FETCHED_AT): RawFile {
  const days = rows.map((row) => row.exmn_ymd).sort()
  const ymd = (compact: string) => `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`
  return buildRawFile(
    {
      source: "kamis",
      endpoint: KAMIS_ENDPOINT,
      job: "daily",
      ingestRunId,
      runStartedAt: "2026-10-22T21:30:00.000Z",
      fetchedAt,
      requests: [{ endpoint: KAMIS_ENDPOINT, params: { pageNo: "1" }, httpStatus: 200, resultCode: "0", rowCount: rows.length }],
      targetFrom: ymd(days[0]!),
      targetTo: ymd(days.at(-1)!),
      contractBaseline: "baseline:test",
      adapterVersion: ADAPTER_VERSION,
    },
    rows as unknown as Json[],
  )
}

// 원본을 올렸다고 보고 pending_load로 기록한다. 돌려주는 값: raw_object.id
export async function pending(db: Sql | Tx, file: RawFile, source: DbSource = "kamis"): Promise<number> {
  const runId = await registerRun(db, { source, job: "daily", callBudget: 10 })
  const storagePath = `raw/${source}/test/${randomUUID()}.ndjson.gz`
  await registerPending(db, {
    storagePath,
    header: { ...file.header, ingestRunId: runId },
    contentSha256: file.contentSha256,
    bytesGz: file.bytes.length,
    ingestRunId: runId,
  })
  const [row] = await db<{ id: string }[]>`select id from price.raw_object where storage_path = ${storagePath}`
  return Number(row!.id)
}
