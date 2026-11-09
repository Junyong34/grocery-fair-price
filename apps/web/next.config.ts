import { existsSync } from "node:fs"
import { resolve } from "node:path"

import type { NextConfig } from "next"

// 키는 루트 .env 한 곳에 둔다(수집 스크립트와 같은 파일, pre-commit 비밀 검사 대상). Next는 apps/web/.env*만 읽으므로 여기서 불러온다.
// 이미 있는 환경 변수는 덮어쓰지 않는다. 운영에는 이 파일이 없고 호스팅의 환경 변수를 쓴다.
const rootEnv = resolve(import.meta.dirname, "../../.env")
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/seasonal", "@workspace/price", "@workspace/price-ingest"],
  // 웹 앱 설치 정보가 앱 밖의 Oura 팔레트를 읽으므로 배포 파일 추적 범위를 저장소까지 넓힌다.
  outputFileTracingRoot: resolve(import.meta.dirname, "../.."),
  // 데이터는 기본이 동적이고, 캐시는 "use cache"로 고른다. 정적 셸을 먼저 보내고 나머지는 스트리밍한다.
  // 두 옵션은 다음 메이저에서 항상 켜진다 (node_modules/next/dist/docs/.../cacheComponents.md).
  cacheComponents: true,
  partialPrefetching: true,
  // 에이전트 지침은 루트 AGENTS.md 하나로 관리한다. 켜 두면 next dev가 apps/web/AGENTS.md를 다시 만든다.
  agentRules: false,
  // 전체 품종 목록(/prices)은 품종이 늘면 한 페이지가 끝없이 길어져 뺐다. 이미 알려진 주소는 시세 메인으로 보낸다.
  // shared/routes.ts의 routes.price.varieties와 맞춰 둔다(설정 파일이라 routes를 import하지 않는다).
  async redirects() {
    return [
      { source: "/prices", destination: "/", permanent: true },
      // 상품 목록 페이지도 없다. 상품은 검색 · 카테고리로 찾는다(catalog-scale/10).
      { source: "/products", destination: "/", permanent: true },
    ]
  },
  experimental: {
    // next dev · build가 설치된 버전의 보안 권고를 확인해 안전한 버전을 알린다(기본값과 같다). 자동으로 올리지는 않는다.
    agentUpgrade: "security",
  },
}

export default nextConfig
