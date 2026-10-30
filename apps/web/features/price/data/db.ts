import "server-only"

import postgres from "postgres"

// 가격 화면의 DB 접속. 읽기 전용 롤 web_reader, Supavisor 트랜잭션 모드(6543)라 prepare: false
// (.scratch/price-db-read/spec.md 1장, pipeline.md 3-0 "접속"). 서버에서만 쓰고 브라우저는 DB를 모른다.

type Sql = postgres.Sql

// 개발 중 HMR이 모듈을 다시 읽어도 연결이 쌓이지 않게 클라이언트를 globalThis에 하나만 둔다.
const globalForDb = globalThis as typeof globalThis & { priceWebSql?: Sql }

/** 클라이언트를 처음 부를 때 만든다. 빌드가 이 모듈을 읽기만 해도 환경변수를 요구하지 않게 한다. */
export function db(): Sql {
  globalForDb.priceWebSql ??= connect()
  return globalForDb.priceWebSql
}

function connect(): Sql {
  const url = process.env.WEB_DATABASE_URL
  if (!url) throw new Error("WEB_DATABASE_URL이 없다. 루트 .env(로컬)나 배포 환경변수에 넣는다")
  // 형식이 잘못된 주소는 postgres가 비밀번호가 든 주소 전체를 오류에 담아 던진다(price-ingest load/db.ts).
  // 먼저 검사해 주소 없는 오류로 바꾼다.
  try {
    new URL(url)
  } catch {
    throw new Error("WEB_DATABASE_URL의 형식이 잘못됐다. 비밀번호의 특수문자는 퍼센트 인코딩해서 넣는다")
  }
  return postgres(url, { prepare: false, max: 3, idle_timeout: 20, onnotice: () => {} })
}
