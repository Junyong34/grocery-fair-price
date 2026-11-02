import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { SITE_CONFIG } from "./meta"
import { WEB_APP_BACKGROUND, webAppManifest } from "./pwa"
import { routes } from "./routes"

describe("홈 화면 웹 앱", () => {
  it("장볼날을 설치하면 시세 메인을 주소창 없는 창으로 연다", () => {
    expect(webAppManifest()).toMatchObject({
      name: SITE_CONFIG.name,
      short_name: "장볼날",
      id: routes.home,
      start_url: routes.home,
      scope: routes.home,
      display: "standalone",
      lang: "ko",
    })
  })

  it("시작 배경과 테마는 사이트의 캔버스 색을 따른다", () => {
    const css = readFileSync(
      new URL("../../../packages/ui/src/styles/globals.css", import.meta.url),
      "utf8"
    )
    expect(css).toContain(`--color-canvas: ${WEB_APP_BACKGROUND};`)
    expect(webAppManifest()).toMatchObject({
      background_color: WEB_APP_BACKGROUND,
      theme_color: WEB_APP_BACKGROUND,
    })
  })

  it("설치 아이콘은 실제 크기가 맞는 기존 브랜드 PNG다", () => {
    const icons = webAppManifest().icons ?? []
    expect(icons.map((icon) => icon.sizes)).toEqual(["192x192", "512x512"])
    for (const icon of icons) {
      expect(icon.src).toMatch(/^\/images\/brand\/favicon-green-/)
      expect(icon.type).toBe("image/png")
      const image = readFileSync(join(process.cwd(), "public", icon.src))
      expect(image.subarray(1, 4).toString()).toBe("PNG")
      expect(`${image.readUInt32BE(16)}x${image.readUInt32BE(20)}`).toBe(
        icon.sizes
      )
    }
  })
})
