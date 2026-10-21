// 로컬 Supabase(supabase start)의 Postgres에 붙는 접속 도우미.
// 운영 DB 주소(INGEST_DATABASE_URL, WEB_DATABASE_URL)는 여기서 읽지 않는다. 로컬 검증 전용이다.
import postgres from "postgres"

// supabase/config.toml [db] port. 로컬 기본 소유자 비밀번호는 postgres다.
export const LOCAL_ADMIN_URL =
  process.env.PRICE_DB_ADMIN_URL ?? "postgresql://postgres:postgres@127.0.0.1:55322/postgres"

// 로컬 테스트에서만 앱 롤에 넣는 비밀번호. 운영 비밀번호는 사람이 정한다 (ingest-foundation/01).
export const LOCAL_ROLE_PASSWORD = "local-only-password"

export type AppRole = "ingest_writer" | "web_reader"

export type Sql = postgres.Sql | postgres.TransactionSql

// 트랜잭션 하나로 묶는다. 이미 트랜잭션 안이면(테스트의 롤백 묶음) savepoint로 묶는다.
export function transaction<T>(sql: Sql, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  if ("savepoint" in sql) return sql.savepoint(fn) as Promise<T>
  return sql.begin(fn) as Promise<T>
}

const quiet = { onnotice: () => {}, max: 1 } as const

export function connectAdmin(): postgres.Sql {
  return postgres(LOCAL_ADMIN_URL, quiet)
}

export function connectAs(role: AppRole): postgres.Sql {
  const url = new URL(LOCAL_ADMIN_URL)
  url.username = role
  url.password = LOCAL_ROLE_PASSWORD
  return postgres(url.toString(), quiet)
}

// 앱 롤로 로그인할 수 있게 로컬 비밀번호를 넣는다. 마이그레이션은 비밀번호를 넣지 않는다.
export async function setLocalRolePasswords(admin: Sql): Promise<void> {
  for (const role of ["ingest_writer", "web_reader"] as const) {
    await admin.unsafe(`alter role ${role} with password '${LOCAL_ROLE_PASSWORD}'`)
  }
}
