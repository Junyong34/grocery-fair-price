// DB 테스트 준비: 빈 DB에 마이그레이션·시드를 다시 적용하고(supabase db reset),
// 앱 롤에 로컬 비밀번호를 넣은 뒤 ingest_writer로 샘플 테스트 데이터를 넣는다.
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { connectAdmin, connectAs, setLocalRolePasswords } from "../src/db.ts"
import { loadSamples } from "../src/load-samples.ts"

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url))

export default async function setup() {
  execFileSync("pnpm", ["exec", "supabase", "db", "reset", "--local"], { cwd: repoRoot, stdio: "inherit" })
  const admin = connectAdmin()
  await setLocalRolePasswords(admin)
  await admin.end()
  const ingest = connectAs("ingest_writer")
  await loadSamples(ingest)
  await ingest.end()
}
