import { afterEach, describe, expect, it, vi } from "vitest"

import { breadcrumb, organization, serializeJsonLd, website } from "./json-ld"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("serializeJsonLd", () => {
  it("</script>로 스크립트를 닫지 못하게 <를 이스케이프한다", () => {
    const json = serializeJsonLd({ "@context": "https://schema.org", "@type": "Thing", name: "</script><script>alert(1)</script>" })
    expect(json).not.toContain("<")
    expect(JSON.parse(json).name).toBe("</script><script>alert(1)</script>")
  })
})

describe("빌더", () => {
  it("주소를 공개 주소 기준 절대 주소로 만든다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com")
    expect(website()).toMatchObject({ "@type": "WebSite", name: "장볼날", url: "https://example.com/" })
    expect(organization()).toMatchObject({
      "@type": "Organization",
      url: "https://example.com/",
      logo: "https://example.com/images/brand/logo-symbol-512.png",
    })
  })

  it("빵부스러기는 홈을 앞에 붙이고 1부터 순서를 매긴다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com")
    expect(breadcrumb([{ name: "3월 제철 음식", path: "/seasonal/months/3" }])).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "장볼날", item: "https://example.com/" },
        { "@type": "ListItem", position: 2, name: "3월 제철 음식", item: "https://example.com/seasonal/months/3" },
      ],
    })
  })
})
