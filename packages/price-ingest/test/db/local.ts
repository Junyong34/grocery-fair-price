// DB 테스트가 붙는 로컬 Supabase(supabase start). 값은 메모리에만 두고 출력하지 않는다.
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { connectIngest, type Sql, type Tx } from "../../src/load/db.ts"
import { createObjectStore, type ObjectStore } from "../../src/load/storage.ts"

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url))
export const ADMIN_URL = "postgresql://postgres:postgres@127.0.0.1:55322/postgres"
const INGEST_URL = "postgresql://ingest_writer:local-only-password@127.0.0.1:55322/postgres"

// supabase status의 로컬 값
function localStatus(): Record<string, string> {
  const text = execFileSync("pnpm", ["exec", "supabase", "status", "-o", "env"], { cwd: REPO_ROOT, encoding: "utf8" })
  const values: Record<string, string> = {}
  for (const line of text.split("\n")) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim())
    if (match?.[1] !== undefined) values[match[1]] = (match[2] ?? "").replace(/^"|"$/g, "")
  }
  return values
}

export function localStore(): ObjectStore {
  const local = localStatus()
  return createObjectStore({ url: local.API_URL ?? "", secretKey: local.SECRET_KEY ?? "" })
}

// 앱 롤에 로컬 비밀번호를 넣고(마이그레이션은 넣지 않는다) ingest_writer로 붙는다.
export async function connectLocalIngest(): Promise<Sql> {
  const admin = connectIngest(ADMIN_URL)
  await admin.unsafe("alter role ingest_writer with password 'local-only-password'")
  await admin.end()
  return connectIngest(INGEST_URL)
}

export function connectLocalAdmin(): Sql {
  return connectIngest(ADMIN_URL)
}

const ROLLBACK = Symbol("rollback")

// 묶음 안의 쓰기를 모두 되돌린다. 다른 테스트와 샘플 데이터를 바꾸지 않는다.
export async function inRollback(sql: Sql, fn: (tx: Tx) => Promise<void>): Promise<void> {
  try {
    await sql.begin(async (tx) => {
      await fn(tx)
      throw ROLLBACK
    })
  } catch (error) {
    if (error !== ROLLBACK) throw error
  }
}
