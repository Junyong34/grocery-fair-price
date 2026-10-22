import { defineConfig } from "vitest/config"

// 로컬 Supabase(supabase start)의 DB와 Storage가 떠 있어야 한다. 루트 pnpm test에는 들어가지 않는다.
export default defineConfig({
  test: {
    include: ["test/db/**/*.db.test.ts"],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
})
