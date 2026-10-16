import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/shared/meta"
import { SEO_PAGES } from "@/shared/seo/pages"

// 색인 대상 페이지 목록. 내용은 shared/seo/pages.ts 레지스트리가 정하고 여기서는 절대 주소로 펼치기만 한다.
// priority·changefreq는 구글이 무시하므로 넣지 않는다. 색인 스위치와 상관없이 열어 두고, robots.txt가 이 주소를 알릴지만 바뀐다.
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(SEO_PAGES).flatMap((entries) =>
    entries().map(({ path, images, lastModified }) => ({
      url: absoluteUrl(path),
      ...(lastModified && { lastModified }),
      ...(images && { images: images.map(absoluteUrl) }),
    }))
  )
}
