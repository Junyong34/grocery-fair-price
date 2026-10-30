import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { FESTIVALS } from "@workspace/seasonal/data/festivals"
import { FOODS, isDrawn } from "@workspace/seasonal/data/foods"

import { DOWNLOADS } from "@/shared/downloads-manifest"

import { DATA_SEO_PAGES, NOINDEX_ROUTES, REDIRECT_ROUTES, SEO_PAGES, seoPolicyOf } from "./pages"
import { routePatternOf } from "./route-pattern"

const APP_DIR = fileURLToPath(new URL("../../app", import.meta.url))

// app/ 아래 모든 page 파일의 라우트 패턴. @slot·가로채기 라우트는 자기 주소가 없어 뺀다.
const pagePatterns = readdirSync(APP_DIR, { recursive: true, encoding: "utf8" })
  .filter((file) => /(^|[\\/])page\.(tsx|ts|jsx|js|mdx)$/.test(file))
  .map(routePatternOf)
  .filter((pattern): pattern is string => pattern !== null)

const HINT = "새 페이지는 apps/web/shared/seo/pages.ts에 등록한다. 절차: apps/web/docs/seo.md"

describe("SEO 레지스트리 가드", () => {
  it("모든 페이지가 색인 대상·noindex·리디렉션 가운데 하나로 등록되어 있다", () => {
    const missing = pagePatterns.filter((pattern) => seoPolicyOf(pattern) === undefined)
    expect(missing, HINT).toEqual([])
  })

  it("레지스트리에 적힌 라우트는 실제 페이지가 있다", () => {
    const registered = [...Object.keys(SEO_PAGES), ...DATA_SEO_PAGES, ...REDIRECT_ROUTES]
    const orphans = registered.filter((pattern) => !pagePatterns.includes(pattern))
    expect(orphans, "지운 페이지는 pages.ts에서도 지운다").toEqual([])
    const unusedPrefixes = NOINDEX_ROUTES.filter((prefix) => !pagePatterns.some((pattern) => pattern === prefix || pattern.startsWith(`${prefix}/`)))
    expect(unusedPrefixes, "지운 페이지는 pages.ts에서도 지운다").toEqual([])
  })

  it("색인 대상은 noindex 접두 경로 아래에 있지 않다", () => {
    const both = Object.keys(SEO_PAGES).filter((pattern) => NOINDEX_ROUTES.some((prefix) => pattern === prefix || pattern.startsWith(`${prefix}/`)))
    expect(both).toEqual([])
  })
})

describe("SEO_PAGES", () => {
  const paths = Object.values(SEO_PAGES).flatMap((entries) => entries().map((entry) => entry.path))

  it("sitemap 경로는 겹치지 않는 절대 경로다", () => {
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths.every((path) => path.startsWith("/") && !path.includes("#"))).toBe(true)
  })

  it("품종 페이지는 그림이 있을 때만 일러스트를 이미지로 알린다", () => {
    const foods = SEO_PAGES["/seasonal/foods/[food]"]!()
    const crab = foods.find((entry) => entry.path === "/seasonal/foods/snow-crab")!
    expect(crab.images).toEqual(["/foods/snow-crab/color.svg"])
    // 2026-10-23부터 모든 품종에 그림이 있다. 그림 없는 품종이 다시 생기면 그 페이지에는 이미지가 없어야 한다.
    for (const food of FOODS.filter((food) => !isDrawn(food.id)))
      expect(foods.find((entry) => entry.path === `/seasonal/foods/${food.id}`)!.images).toBeUndefined()
  })

  it("정적 생성되는 상세 페이지를 모두 담는다", () => {
    // P1 1 + 2a 1 + 2b 목록 1 + 월 12 + 3a 목록 1 + 계절 4 + PDF 내려받기 1 + 개인정보 처리방침 1 + 게시된 에디션 + 명절 + 품종
    expect(paths).toHaveLength(1 + 1 + 1 + 12 + 1 + 4 + 1 + 1 + DOWNLOADS.editions.length + FESTIVALS.length + FOODS.length)
  })
})
