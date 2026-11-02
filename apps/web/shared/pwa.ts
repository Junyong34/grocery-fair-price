import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { MetadataRoute } from "next"

import { SITE_CONFIG } from "./meta"
import { routes } from "./routes"

// manifest와 브라우저 메타데이터는 CSS 변수를 해석하지 못하므로 원본 팔레트에서 값을 읽는다.
// 정적 경로를 유지해야 Next의 파일 추적이 배포 묶음에 CSS를 포함한다.
const palette = readFileSync(
  join(process.cwd(), "../../packages/ui/src/styles/globals.css"),
  "utf8"
)
const canvas = palette.match(/--color-canvas:\s*(#[\da-fA-F]{6})\s*;/)?.[1]
if (!canvas) throw new Error("Oura 팔레트에서 웹 앱 배경색을 찾을 수 없습니다.")

export const WEB_APP_BACKGROUND = canvas

/** 다운로드 목록과 별개인 웹 앱 설치 정보. 시세·제철 화면 전체를 하나의 앱으로 연다. */
export function webAppManifest(): MetadataRoute.Manifest {
  return {
    id: routes.home,
    name: SITE_CONFIG.name,
    short_name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    lang: "ko",
    start_url: routes.home,
    scope: routes.home,
    display: "standalone",
    background_color: WEB_APP_BACKGROUND,
    theme_color: WEB_APP_BACKGROUND,
    icons: [
      {
        src: "/images/brand/favicon-green-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/brand/favicon-green-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
