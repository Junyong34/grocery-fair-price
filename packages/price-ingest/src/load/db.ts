// 적재용 DB 접속. 롤 ingest_writer, Supavisor 세션 모드(5432)로 접속한다 (pipeline 3-0 "접속").
// 트랜잭션 모드(6543)는 쓰지 않는다. 임시 표와 COPY가 연결 공유와 맞지 않는다.
import postgres from "postgres"

export type Sql = postgres.Sql
export type Tx = postgres.TransactionSql

export function connectIngest(url: string): Sql {
  return postgres(url, { max: 1, onnotice: () => {} })
}

// 트랜잭션 하나로 묶는다. 이미 트랜잭션 안이면(테스트의 롤백 묶음) savepoint로 묶는다.
export function transaction<T>(sql: Sql | Tx, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if ("savepoint" in sql) return sql.savepoint(fn) as Promise<T>
  return sql.begin(fn) as Promise<T>
}
