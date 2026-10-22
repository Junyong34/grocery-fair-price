import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

// 실측 테스트는 실제 공공 API를 부른다. 키는 루트 .env의 DATA_GO_KR_SERVICE_KEY에서 읽는다 (이미 있는 환경변수는 덮지 않는다).
const rootEnv = fileURLToPath(new URL("../../.env", import.meta.url))
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

export default defineConfig({
  test: {
    include: ["test/live/**/*.live.test.ts"],
    fileParallelism: false,
    testTimeout: 60_000,
  },
})
