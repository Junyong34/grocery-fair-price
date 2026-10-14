import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  // 데이터는 기본이 동적이고, 캐시는 "use cache"로 고른다. 정적 셸을 먼저 보내고 나머지는 스트리밍한다.
  // 두 옵션은 다음 메이저에서 항상 켜진다 (node_modules/next/dist/docs/.../cacheComponents.md).
  cacheComponents: true,
  partialPrefetching: true,
}

export default nextConfig
