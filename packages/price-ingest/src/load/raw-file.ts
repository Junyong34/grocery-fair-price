// 원본 파일: 줄 단위 JSON을 gzip으로 묶은 것 (pipeline 3-7).
//   1번째 줄: 헤더 (출처, 엔드포인트, 받은 실행, 호출 기록, 시각, 행 수, 계약 기준, 어댑터 버전)
//   2번째 줄부터: 응답의 행을 손대지 않고 그대로
// 헤더를 파일 안에 두어서, DB 기록이 없어도 파일만으로 기록을 다시 만들 수 있다.
import { createHash } from "node:crypto"
import { gunzipSync, gzipSync } from "node:zlib"

import { z } from "zod"

import type { CallRecord } from "../http.ts"
import { dayPrefix } from "./window.ts"
import { RUN_JOBS, type DbSource, type RunJob } from "./types.ts"

export const RAW_BUCKET = "raw"

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export type RawHeader = {
  source: DbSource
  endpoint: string
  job: RunJob
  // 받은 실행의 ingest_run.id. DB가 안 되어 실행 기록을 못 만들었으면 null
  ingestRunId: number | null
  // 받은 실행의 시작 시각. 실행 기록이 없을 때 대조가 이 값으로 그 실행을 기록한다
  runStartedAt: string
  fetchedAt: string
  requests: CallRecord[]
  callCount: number
  rowCount: number
  targetFrom: string | null
  targetTo: string | null
  contractBaseline: string
  adapterVersion: string
}

export type RawHeaderInput = Omit<RawHeader, "callCount" | "rowCount">

export type RawFile = {
  bytes: Uint8Array
  // 압축 전 행 내용의 SHA-256 (raw_object.content_sha256). 헤더는 넣지 않는다:
  // 같은 응답을 다른 시각에 다시 받아도 값이 같아야 duplicate를 가린다 (3-7).
  contentSha256: string
  header: RawHeader
  rows: Json[]
}

const callRecordSchema = z.strictObject({
  endpoint: z.string(),
  params: z.record(z.string(), z.string()),
  httpStatus: z.number().int(),
  resultCode: z.string().nullable(),
  rowCount: z.number().int().nonnegative(),
})

const headerSchema = z.strictObject({
  source: z.enum(["kamis", "ekape", "chamga"]),
  endpoint: z.string().min(1),
  job: z.enum(RUN_JOBS),
  ingestRunId: z.number().int().positive().nullable(),
  runStartedAt: z.string().min(1),
  fetchedAt: z.string().min(1),
  requests: z.array(callRecordSchema),
  callCount: z.number().int().nonnegative(),
  rowCount: z.number().int().nonnegative(),
  targetFrom: z.string().nullable(),
  targetTo: z.string().nullable(),
  contractBaseline: z.string().min(1),
  adapterVersion: z.string().min(1),
})

export function sha256Hex(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex")
}

function rowLines(rows: readonly Json[]): string {
  return rows.map((row) => `${JSON.stringify(row)}\n`).join("")
}

export function contentHashOf(rows: readonly Json[]): string {
  return sha256Hex(rowLines(rows))
}

export function buildRawFile(input: RawHeaderInput, rows: readonly Json[]): RawFile {
  const header: RawHeader = { ...input, callCount: input.requests.length, rowCount: rows.length }
  const bytes = gzipSync(`${JSON.stringify(header)}\n${rowLines(rows)}`)
  return { bytes, contentSha256: contentHashOf(rows), header, rows: [...rows] }
}

export function parseRawFile(bytes: Uint8Array): RawFile {
  const [first, ...rest] = gunzipSync(bytes).toString("utf8").split("\n").filter((line) => line.length > 0)
  if (first === undefined) throw new Error("빈 원본 파일이다")
  const header = headerSchema.parse(JSON.parse(first)) as RawHeader
  const rows = rest.map((line) => JSON.parse(line) as Json)
  if (rows.length !== header.rowCount) {
    throw new Error(`헤더의 행 수 ${header.rowCount}와 실제 행 수 ${rows.length}이 다르다`)
  }
  return { bytes, contentSha256: contentHashOf(rows), header, rows }
}

// 호출 키: 묶음 라벨과 받은 시각(밀리초까지). 같은 대상을 다시 받으면 다른 키가 되어,
// 내용이 같아도 기록(duplicate)을 따로 남길 수 있다. 같은 파일을 다시 올리면 같은 키라서 겹쳐 올라가지 않는다.
export function callKeyOf(label: string, fetchedAt: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(label)) throw new Error("호출 키 라벨은 영소문자·숫자·하이픈만 쓴다")
  const compact = new Date(fetchedAt).toISOString().replace(/[-:.]/g, "")
  return `${label}-${compact}`
}

// 버킷 안의 객체 키: {출처}/{YYYY}/{MM}/{DD}/{호출키}.ndjson.gz (DD는 KST 수집일)
export function rawObjectKey(source: DbSource, collectedOn: string, callKey: string): string {
  return `${dayPrefix(source, collectedOn)}${callKey}.ndjson.gz`
}

// raw_object.storage_path: 버킷 이름을 앞에 붙인 경로 raw/{출처}/… (DB 열 주석, pipeline 3-7)
export function storagePathOf(objectKey: string): string {
  return `${RAW_BUCKET}/${objectKey}`
}

export function objectKeyOf(storagePath: string): string {
  const prefix = `${RAW_BUCKET}/`
  if (!storagePath.startsWith(prefix)) throw new Error(`storage_path가 ${prefix}로 시작하지 않는다`)
  return storagePath.slice(prefix.length)
}
