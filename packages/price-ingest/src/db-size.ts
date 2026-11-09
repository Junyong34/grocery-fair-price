// DB 크기 기록 (catalog-scale/03). KAMIS 워크플로가 매일 수집 뒤에 부른다.
//   pnpm --filter @workspace/price-ingest size
// 전체 크기와 price 표별 크기·행 수(추정)를 price.db_size에 한 행 남긴다. 문턱(calc_param db.size_alert_mb)을 넘으면
// 로그에 경고만 찍는다. 알림 이슈는 이슈 권한이 있는 heartbeat가 연다.
// Postgres는 지운 행의 자리를 파일 크기로 돌려주지 않고 다음 적재에 다시 쓴다. 보존 정리 뒤에도 크기가 줄지 않는 것이 정상이다.
// 환경변수: INGEST_DATABASE_URL. .env를 스스로 읽지 않는다.
import { connectIngest, type Sql, type Tx } from "./load/db.ts"
import { actionsMaskCommands, describeError, redactorFromEnv, SECRET_ENV } from "./secrets.ts"

const MB = 1024 * 1024
export const SIZE_LIMIT_KEY = "db.size_alert_mb"

export type DbSize = { dbBytes: number; tables: Record<string, { bytes: number; rows: number }> }

// calc_param 값(jsonb)을 MB 문턱으로. 없거나 양수가 아니면 멈춘다
export function sizeLimitMbOf(value: unknown): number {
  const mb = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  if (!Number.isFinite(mb) || mb <= 0) throw new Error(`calc_param ${SIZE_LIMIT_KEY}가 양수가 아니다`)
  return mb
}

// 문턱 이상이면 알림 문장, 아니면 null
export function sizeAlertOf(dbBytes: number, limitMb: number): string | null {
  if (dbBytes < limitMb * MB) return null
  return `DB가 ${Math.round(dbBytes / MB)}MB로 문턱 ${limitMb}MB 이상이다. 표별 크기는 price.db_size 최근 행에 있다`
}

export async function readSizeLimitMb(tx: Sql | Tx): Promise<number> {
  const [row] = await tx<{ value: unknown }[]>`select value from price.calc_param where key = ${SIZE_LIMIT_KEY}`
  return sizeLimitMbOf(row?.value ?? null)
}

export async function measureDbSize(tx: Sql | Tx): Promise<DbSize> {
  const [db] = await tx<{ bytes: string }[]>`select pg_database_size(current_database())::text as bytes`
  const rows = await tx<{ name: string; bytes: string; rows: string }[]>`
    select c.relname as name, pg_total_relation_size(c.oid)::text as bytes, greatest(c.reltuples, 0)::bigint::text as rows
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'price' and c.relkind = 'r'
     order by c.relname`
  return {
    dbBytes: Number(db!.bytes),
    tables: Object.fromEntries(rows.map((r) => [r.name, { bytes: Number(r.bytes), rows: Number(r.rows) }])),
  }
}

export async function recordDbSize(tx: Sql | Tx): Promise<DbSize> {
  const size = await measureDbSize(tx)
  await tx`insert into price.db_size (db_bytes, tables) values (${size.dbBytes}, ${tx.json(size.tables)})`
  return size
}

async function main(): Promise<void> {
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const line of actionsMaskCommands(SECRET_ENV.map((name) => process.env[name]))) console.log(line)
  }
  const url = process.env.INGEST_DATABASE_URL
  if (!url) throw new Error("환경변수 INGEST_DATABASE_URL가 없다")
  const sql = connectIngest(url)
  try {
    const size = await recordDbSize(sql)
    const limit = await readSizeLimitMb(sql)
    console.log(`DB 크기: ${Math.round(size.dbBytes / MB)}MB (문턱 ${limit}MB)`)
    const top = Object.entries(size.tables).sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 5)
    for (const [name, t] of top) console.log(`  ${name}: ${Math.round(t.bytes / MB)}MB, 약 ${t.rows}행`)
    const warning = sizeAlertOf(size.dbBytes, limit)
    if (warning) console.log(`::warning::${warning}`)
  } finally {
    await sql.end()
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(describeError(error, redactorFromEnv()))
    process.exitCode = 1
  })
}
