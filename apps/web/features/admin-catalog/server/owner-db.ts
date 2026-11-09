import "server-only"

import postgres from "postgres"

import { assertAdmin } from "@/features/admin-print/server/guard"

// 카탈로그 어드민의 DB 접속 (ADR 0005). 카탈로그 표는 운영자 표라 소유자(postgres)로만 고친다.
// 루트 .env의 OWNER_DATABASE_URL을 쓴다. 로컬 .env에서는 이 주소가 운영 DB다. 개발 서버에서만 연다.
type Sql = postgres.Sql

const globalForOwner = globalThis as typeof globalThis & { catalogOwnerSql?: Sql }

export function ownerDb(): Sql {
  assertAdmin()
  globalForOwner.catalogOwnerSql ??= connect()
  return globalForOwner.catalogOwnerSql
}

function connect(): Sql {
  const url = process.env.OWNER_DATABASE_URL
  if (!url) throw new Error("OWNER_DATABASE_URL이 없다. 루트 .env에 넣는다")
  try {
    new URL(url)
  } catch {
    // postgres는 형식이 잘못된 주소를 비밀번호째 오류에 담는다. 주소 없는 오류로 바꾼다
    throw new Error("OWNER_DATABASE_URL의 형식이 잘못됐다")
  }
  return postgres(url, { prepare: false, max: 2, idle_timeout: 20, onnotice: () => {} })
}

/** 어느 DB를 고치는지 화면에 보일 이름. 주소는 보이지 않는다 */
export function ownerDbLabel(): "로컬 DB" | "운영 DB" | "설정 없음" {
  const url = process.env.OWNER_DATABASE_URL
  if (!url) return "설정 없음"
  try {
    const host = new URL(url).hostname
    return host === "127.0.0.1" || host === "localhost" ? "로컬 DB" : "운영 DB"
  } catch {
    return "설정 없음"
  }
}
