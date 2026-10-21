// 권한·RLS (ingest-foundation/02 완료 기준 1~5, pipeline.md 3-0)
import { afterAll, describe, expect, test } from "vitest"

import { connectAdmin, connectAs } from "../src/db.ts"
import { OPERATOR_TABLES, PRICE_TABLES, WEB_READ, inRollback, sqlState } from "./helpers.ts"

const admin = connectAdmin()
const web = connectAs("web_reader")
const ingest = connectAs("ingest_writer")

afterAll(async () => {
  await Promise.all([admin.end(), web.end(), ingest.end()])
})

const PERMISSION_DENIED = "42501"
const READ_ONLY_TRANSACTION = "25006"

describe("마이그레이션 결과", () => {
  test("표 40개, 뷰 1개가 모두 RLS를 켜고 있다", async () => {
    const rows = await admin<{ relname: string; relkind: string; relrowsecurity: boolean }[]>`
      select c.relname, c.relkind, c.relrowsecurity
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'price' and c.relkind in ('r', 'v')`
    const tables = rows.filter((r) => r.relkind === "r")
    expect(tables.map((r) => r.relname).sort()).toEqual([...PRICE_TABLES].sort())
    expect(tables.filter((r) => !r.relrowsecurity)).toEqual([])
    expect(rows.filter((r) => r.relkind === "v").map((r) => r.relname)).toEqual(["current_judgment"])
  })

  test("롤은 로그인만 되고 superuser·상속·롤 생성이 없으며, web_reader는 읽기 전용이다", async () => {
    const roles = await admin<{ rolname: string; rolsuper: boolean; rolinherit: boolean; rolcreaterole: boolean;
      rolcreatedb: boolean; rolbypassrls: boolean; rolcanlogin: boolean; rolconfig: string[] }[]>`
      select rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolbypassrls, rolcanlogin, rolconfig
      from pg_roles where rolname in ('ingest_writer', 'web_reader') order by rolname`
    for (const r of roles) {
      expect(r).toMatchObject({ rolsuper: false, rolinherit: false, rolcreaterole: false, rolcreatedb: false,
        rolbypassrls: false, rolcanlogin: true })
    }
    expect(roles[1]!.rolconfig).toEqual(expect.arrayContaining(["default_transaction_read_only=on", "statement_timeout=5s"]))
    const [owner] = await admin`select count(*)::int as n from pg_class c join pg_namespace n on n.oid = c.relnamespace
                                where n.nspname = 'price' and pg_get_userbyid(c.relowner) <> 'postgres'`
    expect(owner!.n).toBe(0)
  })
})

describe("(1) web_reader는 읽기 표마다 넣어 둔 행이 보인다", () => {
  // 정책이 빠지면 오류 없이 빈 결과만 나온다. 그래서 표마다 행 수를 본다.
  test.each(WEB_READ)("%s", async (table) => {
    const [row] = await web.unsafe(`select count(*)::int as n from price.${table}`)
    expect(row!.n).toBeGreaterThan(0)
  })
})

describe("(2) web_reader는 읽기 표가 아닌 표를 못 읽고 아무 표에도 못 쓴다", () => {
  test.each(["observation", "source_day", "raw_object"])("%s 읽기는 42501", async (table) => {
    expect(await sqlState(() => web.unsafe(`select 1 from price.${table} limit 1`))).toBe(PERMISSION_DENIED)
  })

  test.each(PRICE_TABLES.filter((t) => !(WEB_READ as readonly string[]).includes(t)))("%s 읽기는 42501", async (table) => {
    expect(await sqlState(() => web.unsafe(`select 1 from price.${table} limit 1`))).toBe(PERMISSION_DENIED)
  })

  test("세션 기본값이 읽기 전용이라 쓰기는 먼저 25006에 막힌다", async () => {
    expect(await sqlState(() => web`delete from price.daily_quote where false`)).toBe(READ_ONLY_TRANSACTION)
  })

  // 읽기 전용을 세션에서 풀어도 GRANT가 막는다.
  test.each(PRICE_TABLES)("read write 트랜잭션에서도 %s 쓰기는 42501", async (table) => {
    const state = await sqlState(() =>
      web.begin(async (tx) => {
        await tx`set transaction read write`
        await tx.unsafe(`delete from price.${table} where false`)
      }),
    )
    expect(state).toBe(PERMISSION_DENIED)
  })
})

describe("(3) anon·authenticated는 price의 어느 표도 못 읽는다", () => {
  for (const role of ["anon", "authenticated"] as const) {
    test.each([...PRICE_TABLES, "current_judgment"])(`${role}: %s`, async (table) => {
      const state = await sqlState(() =>
        inRollback(admin, async (tx) => {
          await tx.unsafe(`set local role ${role}`)
          await tx.unsafe(`select 1 from price.${table} limit 1`)
        }),
      )
      expect(state).toBe(PERMISSION_DENIED)
    })
  }
})

describe("(4) ingest_writer는 운영자 표를 읽기만 한다", () => {
  test.each(OPERATOR_TABLES)("%s 쓰기는 42501, 읽기는 된다", async (table) => {
    expect(await sqlState(() => ingest.unsafe(`delete from price.${table} where false`))).toBe(PERMISSION_DENIED)
    expect(await sqlState(() => ingest.unsafe(`select 1 from price.${table} limit 1`))).toBeNull()
  })

  test("분류 표에 넣기는 42501", async () => {
    expect(await sqlState(() => ingest`insert into price.category (slug, name) values ('x', 'x')`)).toBe(PERMISSION_DENIED)
  })

  test("세션 임시 표를 만들 수 있다", async () => {
    expect(await sqlState(() => ingest.begin((tx) => tx`create temp table t (x int) on commit drop`))).toBeNull()
  })
})

describe("(5) PUBLIC·anon·authenticated에 새어 나간 권한이 없다 (pipeline.md 3-0 \"기본 권한의 한계\")", () => {
  test("실행할 수 있는 price 함수가 없다", async () => {
    const rows = await admin`
      select p.oid::regprocedure::text, r.rolname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      cross join (values ('public'), ('anon'), ('authenticated')) r (rolname)
      where n.nspname = 'price' and has_function_privilege(r.rolname, p.oid, 'execute')`
    expect(rows).toEqual([])
  })

  test("권한을 가진 price 표·뷰가 없다", async () => {
    const rows = await admin`
      select c.oid::regclass::text, r.rolname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      cross join (values ('public'), ('anon'), ('authenticated')) r (rolname)
      where n.nspname = 'price' and c.relkind in ('r', 'p', 'v', 'm')
        and has_table_privilege(r.rolname, c.oid, 'select, insert, update, delete, truncate, references, trigger')`
    expect(rows).toEqual([])
  })

  test("price 함수가 하나 이상 있어 위 검사가 빈 검사가 아니다", async () => {
    const [row] = await admin`select count(*)::int as n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                              where n.nspname = 'price'`
    expect(row!.n).toBeGreaterThan(0)
  })
})
