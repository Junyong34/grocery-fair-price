import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/shared/meta"
import { isIndexable } from "@/shared/seo/indexing"

// 색인 스위치(SITE_INDEXABLE)가 꺼져 있으면 전체를 막는다. 켜져 있으면 전체를 열고 sitemap을 알린다.
// 색인하지 않을 페이지는 여기서 Disallow하지 않고 페이지의 noindex로 막는다(shared/seo/pages.ts NOINDEX_ROUTES).
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: "*", disallow: "/" } }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
