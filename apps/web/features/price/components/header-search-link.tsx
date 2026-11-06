"use client"

import { routes } from "@/shared/routes"
import { usePublicPathname } from "@/shared/shell/public-path"
import { SearchLink } from "@/shared/shell/search-link"

/**
 * 가격 영역 루트 헤더의 🔍. P1(`/`)에서는 그리지 않는다: 본문 히어로에 검색창이 있고,
 * 그 검색창이 위로 지나가면 헤더 아래 고정 검색 줄(home/search-row)이 대신 붙어 어느 스크롤 위치에서도 검색이 겹친다.
 */
export function HeaderSearchLink() {
  const pathname = usePublicPathname()
  if (pathname === routes.home) return null
  return <SearchLink href={routes.price.search} label="시세 검색" />
}
