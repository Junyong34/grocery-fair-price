// 적재용 DB 접속. 롤 ingest_writer, Supavisor 세션 모드(5432)로 접속한다 (pipeline 3-0 "접속").
// 트랜잭션 모드(6543)는 쓰지 않는다. 임시 표와 COPY가 연결 공유와 맞지 않는다.
import postgres from "postgres"

export type Sql = postgres.Sql

export function connectIngest(url: string): Sql {
  return postgres(url, { max: 1, onnotice: () => {} })
}
