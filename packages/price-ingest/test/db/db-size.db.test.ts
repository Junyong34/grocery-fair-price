// DB 크기 기록 (catalog-scale/03). 롤백 묶음 안에서 ingest_writer로 한 행을 남기고 문턱을 읽는다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { readSizeLimitMb, recordDbSize } from "../../src/db-size.ts"
import type { Sql } from "../../src/load/db.ts"
import { connectLocalIngest, inRollback } from "./local.ts"

let sql: Sql

beforeAll(async () => {
  sql = await connectLocalIngest()
})

afterAll(async () => {
  await sql.end()
})

describe("DB 크기 기록", () => {
  it("전체 크기와 price 표별 크기를 한 행으로 남기고, 문턱은 calc_param에서 읽는다", async () => {
    await inRollback(sql, async (tx) => {
      const size = await recordDbSize(tx)
      expect(size.dbBytes).toBeGreaterThan(0)
      expect(size.tables.observation?.bytes).toBeGreaterThan(0)
      expect(Object.keys(size.tables)).toContain("db_size")
      const [row] = await tx<{ db_bytes: string; tables: Record<string, { bytes: number }> }[]>`
        select db_bytes::text, tables from price.db_size order by taken_at desc limit 1`
      expect(Number(row!.db_bytes)).toBe(size.dbBytes)
      expect(row!.tables.observation?.bytes).toBe(size.tables.observation?.bytes)
      expect(await readSizeLimitMb(tx)).toBe(400)
    })
  })
})
