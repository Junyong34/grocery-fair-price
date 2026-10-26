// COPY … FROM STDIN (text 형식)으로 세션 임시 표에 행을 넣는다.
// RLS가 켜진 영구 표에는 COPY FROM을 못 하므로 (pipeline.md 3-0) 대상은 늘 임시 표다.
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { Sql, Tx } from "./db.ts"

export type CopyValue = string | number | boolean | null | readonly string[]

function encode(value: CopyValue): string {
  if (value === null) return "\\N"
  if (typeof value === "boolean") return value ? "t" : "f"
  if (typeof value === "number") return String(value)
  if (Array.isArray(value)) return encode(`{${value.map((v) => `"${v.replace(/["\\]/g, "\\$&")}"`).join(",")}}`)
  return (value as string).replace(/[\\\t\n\r]/g, (c) => ({ "\\": "\\\\", "\t": "\\t", "\n": "\\n", "\r": "\\r" })[c]!)
}

export async function copyInto<T extends Record<string, CopyValue>>(
  sql: Sql | Tx,
  table: string,
  columns: readonly (keyof T & string)[],
  rows: readonly T[],
): Promise<void> {
  const text = rows.map((row) => columns.map((c) => encode(row[c] ?? null)).join("\t") + "\n").join("")
  const writable = await sql.unsafe(`copy ${table} (${columns.join(", ")}) from stdin`).writable()
  await pipeline(Readable.from([text]), writable)
}
