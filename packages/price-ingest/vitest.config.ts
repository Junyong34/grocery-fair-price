import { defineConfig } from "vitest/config"

// 기본 테스트는 키·네트워크 없이 돈다. 실측 테스트(test/live)는 vitest.live.config.ts로만 돈다.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["test/live/**", "node_modules/**"],
  },
})
