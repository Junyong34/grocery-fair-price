import type { Metadata } from "next"

import type { Season } from "@workspace/seasonal/data/seasons"

// 사이트 이름·설명. 서버(메타데이터·OG 이미지)와 브라우저(공유 버튼)가 함께 읽는다.
// 주소는 여기 두지 않는다. 브라우저는 환경 변수를 서버와 똑같이 읽을 수 없어서 siteUrl()(서버)과 location.origin(브라우저)으로 나눈다.
export const SITE_CONFIG = {
  name: "제철달력",
  titleDefault: "제철달력 - 언제 뭐가 맛있을까",
  titleTemplate: "%s | 제철달력",
  description: "열두 달과 사계절, 우리 땅에서 가장 맛있는 제철 식재료와 명절 절식을 찾아보세요.",
  locale: "ko_KR",
} as const

/**
 * 공개 주소(서버 전용). 루트 레이아웃의 metadataBase가 쓰고, 페이지 메타데이터의 상대 경로(canonical, og:url, og:image)는 이 주소로 바뀐다.
 * NEXT_PUBLIC_SITE_URL(직접 지정) → Vercel 운영 도메인 → 로컬 개발 주소 순서. VERCEL_URL은 배포마다 바뀌어 쓰지 않는다.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

/** /api/og가 받는 글자. 길이는 route에서 자른다(OG_LIMITS). */
export type OgImageText = {
  title?: string
  subtitle?: string
  /** 제목 위 작은 배지 */
  badge?: string
  /** 배경 색 번짐에 쓸 계절. 없으면 네 계절 색이 모두 옅게 깔린다. */
  season?: Season
}

export type CreateMetadataOptions = {
  /** 페이지 제목. 탭 제목에는 루트 레이아웃이 " | 제철달력"을 붙인다. 없으면 사이트 기본 제목. */
  title?: string
  description?: string
  /** routes로 만든 경로. canonical·og:url이 된다. */
  path?: string
  /** OG 이미지 글자. 없으면 title·description을 쓴다. 문자열이면 이미지 주소 그대로. */
  ogImage?: OgImageText | string
  noIndex?: boolean
}

/** /api/og 상대 주소. metadataBase가 절대 주소로 바꾼다. */
export function ogImagePath(text: OgImageText = {}): string {
  const params = new URLSearchParams()
  for (const key of ["title", "subtitle", "badge", "season"] as const) {
    const value = text[key]
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `/api/og?${query}` : "/api/og"
}

/**
 * 페이지 메타데이터(제목·설명·canonical·OpenGraph·Twitter 카드). 새 페이지는 이것만 부르면 OG 이미지까지 이어진다.
 * 정적 페이지는 `export const metadata = createMetadata({...})`, 동적 페이지는 generateMetadata에서 돌려준다.
 */
export function createMetadata(options: CreateMetadataOptions = {}): Metadata {
  const fullTitle = options.title ? `${options.title} | ${SITE_CONFIG.name}` : SITE_CONFIG.titleDefault
  const description = options.description ?? SITE_CONFIG.description
  const image =
    typeof options.ogImage === "string"
      ? options.ogImage
      : ogImagePath(options.ogImage ?? { title: options.title, subtitle: options.description })

  return {
    // 꼬리(" | 제철달력")는 루트 레이아웃의 title.template이 붙인다. 제목이 없으면 템플릿을 건너뛰는 기본 제목.
    title: options.title ?? { absolute: SITE_CONFIG.titleDefault },
    description,
    alternates: options.path ? { canonical: options.path } : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url: options.path,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    robots: options.noIndex ? { index: false, follow: false } : undefined,
  }
}
