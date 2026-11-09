import "server-only"

import postgres from "postgres"

import { assertAdmin } from "@/features/admin-print/server/guard"

// 카탈로그 어드민의 읽기 전용 접속 (식재료 목록 · 상품 목록). 고치지 않으므로 소유자가 아니라 ingest_writer(루트 .env INGEST_DATABASE_URL)로 읽는다.
// web_reader는 원천 키·매핑 표를 못 읽는다(ADR 0002). 개발 서버에서만 연다. 로컬 .env의 INGEST_DATABASE_URL은 운영 DB다.

const globalForReader = globalThis as typeof globalThis & { catalogReaderSql?: postgres.Sql }

export function readerDb(): postgres.Sql {
  assertAdmin()
  if (!globalForReader.catalogReaderSql) {
    const url = process.env.INGEST_DATABASE_URL
    if (!url) throw new Error("INGEST_DATABASE_URL이 없다. 루트 .env에 넣는다")
    try {
      new URL(url)
    } catch {
      // postgres는 형식이 잘못된 주소를 비밀번호째 오류에 담는다. 주소 없는 오류로 바꾼다
      throw new Error("INGEST_DATABASE_URL의 형식이 잘못됐다")
    }
    globalForReader.catalogReaderSql = postgres(url, { prepare: false, max: 2, idle_timeout: 20, onnotice: () => {} })
  }
  return globalForReader.catalogReaderSql
}
