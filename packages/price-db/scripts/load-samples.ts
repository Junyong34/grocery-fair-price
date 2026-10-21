// 로컬 DB(supabase db reset 직후)에 저장 샘플로 만든 테스트 데이터를 넣는다.
// 실행: pnpm --filter @workspace/price-db load:samples
import { connectAdmin, connectAs, setLocalRolePasswords } from "../src/db.ts"
import { loadSamples } from "../src/load-samples.ts"

const admin = connectAdmin()
await setLocalRolePasswords(admin)
await admin.end()

const ingest = connectAs("ingest_writer")
try {
  await loadSamples(ingest)
  const counts = await ingest<{ table: string; rows: number }[]>`
    select 'observation' as table, count(*)::int as rows from price.observation
    union all select 'daily_quote', count(*)::int from price.daily_quote
    union all select 'product_daily_summary', count(*)::int from price.product_daily_summary
    union all select 'judgment_snapshot', count(*)::int from price.judgment_snapshot`
  console.table(counts)
} finally {
  await ingest.end()
}
