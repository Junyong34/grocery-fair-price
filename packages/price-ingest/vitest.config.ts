import { defineConfig } from "vitest/config"

// 기본 테스트는 키·네트워크 없이 돈다. 실측(test/live)과 로컬 DB·Storage(test/db)는 따로 돈다.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["test/live/**", "test/db/**", "node_modules/**"],
  },
})
