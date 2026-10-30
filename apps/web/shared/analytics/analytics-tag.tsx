import { GoogleAnalytics } from "@next/third-parties/google"

import { analyticsConfig } from "./config"

/** GA4 스크립트. 설정이 꺼져 있으면 아무것도 그리지 않는다. app/layout.tsx의 </body> 뒤에 둔다. */
export function AnalyticsTag() {
  const config = analyticsConfig()
  if (!config) return null
  return <GoogleAnalytics gaId={config.measurementId} debugMode={config.debug || undefined} />
}
