"use client"

import { sendGAEvent } from "@next/third-parties/google"

import type { AnalyticsEventName, AnalyticsEvents } from "./events"

/**
 * 분석 이벤트 하나를 보낸다. 이름과 매개변수는 카탈로그(./events.ts)가 정한다.
 * GA가 붙지 않은 화면(개발 서버, 측정 ID 없음, 차단기)에서는 아무것도 하지 않는다.
 */
export function track<N extends AnalyticsEventName>(name: N, params: AnalyticsEvents[N]): void {
  if (typeof window === "undefined" || !("dataLayer" in window)) return
  sendGAEvent("event", name, params)
}
