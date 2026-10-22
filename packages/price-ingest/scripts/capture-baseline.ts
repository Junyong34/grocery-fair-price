// 기준 파일을 라이브 실측으로 만든다 (pnpm contract:baseline). 의도한 변경이 있을 때만 다시 돌린다.
// 계약 스키마와 다른 응답은 기준으로 저장하지 않는다. 값(가격)은 저장하지 않는다.
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { describeShape } from "../src/contract/shape.ts"
import { BASELINE_FILE, PROBES, createLiveCall, type Baseline } from "../src/contract/probes.ts"

const rootEnv = fileURLToPath(new URL("../../../.env", import.meta.url))
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY
if (!serviceKey) {
  console.error("DATA_GO_KR_SERVICE_KEY가 없다. 루트 .env에 넣는다.")
  process.exit(1)
}

const live = createLiveCall(serviceKey)
const probes: Baseline["probes"] = {}

for (const probe of PROBES) {
  try {
    const raw = await probe.fetchRaw(live.call)
    const issues = probe.check(raw)
    if (issues.length > 0) {
      console.error(`${probe.id}: 계약과 다른 응답이라 기준으로 저장하지 않는다\n${issues.map((i) => `  - ${i}`).join("\n")}`)
      process.exit(1)
    }
    const entry = { shape: describeShape(raw), codes: probe.codes(raw), rowCount: probe.rows(raw).length }
    probes[probe.id] = entry
    console.log(`${probe.id}: 행 ${entry.rowCount}, 필드 경로 ${Object.keys(entry.shape).length}`)
  } catch (error) {
    console.error(`${probe.id}: ${error instanceof Error ? error.message : "알 수 없는 오류"}`)
    process.exit(1)
  }
}

const baseline: Baseline = {
  capturedAt: new Date().toISOString(),
  note: "라이브 실측의 필드 타입·코드 목록·건수만 담는다 (값은 담지 않는다). 생성: pnpm contract:baseline",
  probes,
}
mkdirSync(dirname(BASELINE_FILE), { recursive: true })
writeFileSync(BASELINE_FILE, `${JSON.stringify(baseline, null, 2)}\n`)
console.log(`기준 저장: ${PROBES.length}개 항목, 호출 ${live.calls()}회`)
