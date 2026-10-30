import { defineConfig } from "vitest/config"

// 가격 읽기 module(features/price/data/queries)의 로컬 DB 테스트. 로컬 Supabase(pnpm db:start)가 떠 있어야 한다.
// 준비는 price-db와 같다: DB를 초기화하고 샘플 데이터와 판정 묶음을 넣는다. 루트 pnpm test에는 들어가지 않는다(pnpm db:test).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["**/*.db.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    globalSetup: ["../../packages/price-db/test/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 180_000,
  },
})
