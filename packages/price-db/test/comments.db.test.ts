// price의 모든 표·뷰·열·함수에 DB 주석(comment on)이 있는지 본다.
// 새 표·열을 더하면 같은 마이그레이션에서 주석을 단다 (supabase/migrations/20261021000500_price_comments.sql 참고).
import { afterAll, expect, test } from "vitest"

import { connectAdmin } from "../src/db.ts"

const admin = connectAdmin()
afterAll(() => admin.end())

test("모든 표·뷰에 주석이 있다", async () => {
  const missing = await admin<{ name: string }[]>`
    select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'price' and c.relkind in ('r', 'v')
      and coalesce(btrim(obj_description(c.oid, 'pg_class')), '') = ''
    order by 1`
  expect(missing.map((r) => r.name)).toEqual([])
})

test("모든 열에 주석이 있다", async () => {
  const missing = await admin<{ name: string }[]>`
    select c.relname || '.' || a.attname as name
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'price' and c.relkind in ('r', 'v') and a.attnum > 0 and not a.attisdropped
      and coalesce(btrim(col_description(a.attrelid, a.attnum)), '') = ''
    order by 1`
  expect(missing.map((r) => r.name)).toEqual([])
})

test("모든 함수에 주석이 있다", async () => {
  const missing = await admin<{ name: string }[]>`
    select p.oid::regprocedure::text as name from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'price' and coalesce(btrim(obj_description(p.oid, 'pg_proc')), '') = ''`
  expect(missing.map((r) => r.name)).toEqual([])
})
