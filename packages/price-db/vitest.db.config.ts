import { defineConfig } from "vitest/config"

// 로컬 Supabase(supabase start)가 떠 있어야 한다. 루트 pnpm test에는 들어가지 않는다.
export default defineConfig({
  test: {
    include: ["test/**/*.db.test.ts"],
    globalSetup: ["test/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 180_000,
  },
})
