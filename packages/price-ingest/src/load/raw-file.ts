// 원본 파일: 줄 단위 JSON을 gzip으로 묶은 것 (pipeline 3-7).
//   1번째 줄: 헤더 (출처, 엔드포인트, 호출 조건, 시각, 행 수, 계약 기준, 어댑터 버전)
//   2번째 줄부터: 응답의 행을 손대지 않고 그대로
// 헤더를 파일 안에 두어서, DB 기록이 없어도 파일만으로 기록을 다시 만들 수 있다.
import { createHash } from "node:crypto"
import { gunzipSync, gzipSync } from "node:zlib"

import { z } from "zod"

import { dayPrefix } from "./window.ts"
import type { DbSource } from "./types.ts"

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export type RawHeader = {
  source: DbSource
  endpoint: string
  fetchedAt: string
  requests: Json[]
  callCount: number
  rowCount: number
  targetFrom: string | null
  targetTo: string | null
  contractBaseline: string
  adapterVersion: string
}

export type RawHeaderInput = Omit<RawHeader, "rowCount">

export type RawFile = {
  bytes: Uint8Array
  sha256: string
  header: RawHeader
  rows: Json[]
}

const headerSchema = z.strictObject({
  source: z.enum(["kamis", "ekape", "chamga"]),
  endpoint: z.string().min(1),
  fetchedAt: z.string().min(1),
  requests: z.array(z.unknown()),
  callCount: z.number().int().nonnegative(),
  rowCount: z.number().int().nonnegative(),
  targetFrom: z.string().nullable(),
  targetTo: z.string().nullable(),
  contractBaseline: z.string().min(1),
  adapterVersion: z.string().min(1),
})

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex")
}

export function buildRawFile(input: RawHeaderInput, rows: readonly Json[]): RawFile {
  const header: RawHeader = { ...input, rowCount: rows.length }
  const text = [header, ...rows].map((line) => JSON.stringify(line)).join("\n") + "\n"
  const bytes = gzipSync(text)
  return { bytes, sha256: sha256Hex(bytes), header, rows: [...rows] }
}

export function parseRawFile(bytes: Uint8Array): RawFile {
  const [first, ...rest] = gunzipSync(bytes).toString("utf8").split("\n").filter((line) => line.length > 0)
  if (first === undefined) throw new Error("빈 원본 파일이다")
  const header = headerSchema.parse(JSON.parse(first)) as RawHeader
  const rows = rest.map((line) => JSON.parse(line) as Json)
  if (rows.length !== header.rowCount) {
    throw new Error(`헤더의 행 수 ${header.rowCount}와 실제 행 수 ${rows.length}이 다르다`)
  }
  return { bytes, sha256: sha256Hex(bytes), header, rows }
}

// 호출 키: 라벨과 내용 해시 앞 12자리. 내용이 같으면 같은 키가 된다.
export function callKeyOf(label: string, sha256: string): string {
  return `${label}-${sha256.slice(0, 12)}`
}

// 객체 키: {출처}/{YYYY}/{MM}/{DD}/{호출키}.ndjson.gz (DD는 KST 수집일)
export function rawObjectKey(source: DbSource, collectedOn: string, callKey: string): string {
  return `${dayPrefix(source, collectedOn)}${callKey}.ndjson.gz`
}
