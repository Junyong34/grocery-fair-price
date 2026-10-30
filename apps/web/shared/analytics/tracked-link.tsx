"use client"

import Link from "next/link"

import type { AnalyticsEventName, AnalyticsEvents } from "./events"
import { track } from "./track"

type Props<N extends AnalyticsEventName> = React.ComponentProps<typeof Link> & { eventName: N; eventParams: AnalyticsEvents[N] }

/** 누르면 이벤트를 보내는 Link. 서버 컴포넌트의 링크에 이벤트를 붙일 때 쓴다. */
export function TrackedLink<N extends AnalyticsEventName>({ eventName, eventParams, onClick, ...props }: Props<N>) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        track(eventName, eventParams)
        onClick?.(event)
      }}
    />
  )
}
