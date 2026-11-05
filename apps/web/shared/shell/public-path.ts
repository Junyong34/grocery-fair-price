"use client"

import { usePathname } from "next/navigation"

import { routes } from "@/shared/routes"

// proxy.ts가 rewrite한 내부 경로를 사용자가 보는 주소로 돌린다(.scratch/seasonal-static/spec.md).
// 미리 그릴 때 usePathname()은 내부 경로(/seasonal/at/2026-11)를, 브라우저에서는 /seasonal을 돌려준다.
// 경로로 "지금 메뉴"를 고르는 셸은 이 값을 써야 서버 HTML과 첫 클라이언트 렌더가 같다(하이드레이션 불일치 방지).
const SEASONAL_AT = /^\/seasonal\/at\/[^/]+$/

/** rewrite된 내부 경로면 공개 주소, 아니면 그대로. */
export function publicPath(pathname: string): string {
  return SEASONAL_AT.test(pathname) ? routes.seasonal.root : pathname
}

/** usePathname()의 공개 주소 판. 셸·메뉴의 현재 위치 판단에 쓴다. */
export function usePublicPathname(): string {
  return publicPath(usePathname())
}
