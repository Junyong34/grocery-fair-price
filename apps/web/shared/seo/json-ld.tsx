import type { BreadcrumbList, Organization, Thing, WebSite, WithContext } from "schema-dts"

import { absoluteUrl, SITE_CONFIG } from "@/shared/meta"
import { routes } from "@/shared/routes"

// 구조화 데이터(JSON-LD). 어느 페이지에 무엇을 넣는지는 .scratch/seo/spec.md "페이지별 색인 정책" 표를 따른다.
// 주소는 siteUrl()(서버 환경 변수)로 만들므로 Server Component에서만 그린다.

type JsonLdData = WithContext<Thing> | readonly WithContext<Thing>[]

/** <script> 안에 넣을 JSON. "</script>"로 태그가 닫히지 않게 <를 이스케이프한다(Next JSON-LD 가이드). */
export function serializeJsonLd(data: JsonLdData): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

/** 페이지에 구조화 데이터를 넣는다. 크롤러가 HTML 원문에서 읽도록 정적으로 그려지는 자리에 둔다. */
export function JsonLd({ data }: { data: JsonLdData }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}

/** 사이트 이름. 구글은 도메인 루트의 홈에서만 읽으므로 routes.home 페이지만 넣는다. */
export function website(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: absoluteUrl("/"),
    inLanguage: "ko-KR",
  }
}

/** 운영 주체와 로고. 로고는 정사각 래스터(구글 기준 최소 112px). */
export function organization(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/brand/logo-symbol-512.png"),
  }
}

/** 빵부스러기. 화면에는 그리지 않고 검색 결과의 경로 표시에만 쓴다. 홈(routes.home)은 앞에 자동으로 붙으므로 그 아래 단계만 넘긴다. */
export function breadcrumb(items: readonly { name: string; path: string }[]): WithContext<BreadcrumbList> {
  const trail = [{ name: SITE_CONFIG.name, path: routes.home }, ...items]
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
