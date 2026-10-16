import { defineConfig } from "vitest/config"

// 순수 함수 테스트. @/ 경로는 tsconfig paths를 그대로 따른다.
// tsconfig는 Next를 위해 jsx: "preserve"라서, .tsx 모듈을 불러오는 테스트를 위해 여기서만 JSX를 변환한다.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  oxc: { jsx: { runtime: "automatic" } },
})
