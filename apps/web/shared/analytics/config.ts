import "server-only"

// 분석 설정을 환경 변수에서 읽는 곳(한 곳). 빌드 · 실행 환경에 같은 값을 넣는다(apps/web/docs/seo.md "환경 변수").
// GA_MEASUREMENT_ID: GA4 측정 ID(G-…). 없으면 분석을 붙이지 않는다.
// GA_DEBUG=true: 개발 서버에서도 붙이고 DebugView로 보낸다. 운영에서는 쓰지 않는다.

export type AnalyticsConfig = { measurementId: string; debug: boolean }

/** 분석을 붙일지. 운영 빌드이거나 GA_DEBUG일 때, 측정 ID가 있을 때만. */
export function analyticsConfig(env: Record<string, string | undefined> = process.env): AnalyticsConfig | null {
  const measurementId = env.GA_MEASUREMENT_ID?.trim()
  if (!measurementId) return null
  const debug = env.GA_DEBUG === "true"
  if (env.NODE_ENV !== "production" && !debug) return null
  return { measurementId, debug }
}
