"use client"

import { routes } from "@/shared/routes"

import { useIsActive } from "./nav-link"

/** 2a(/seasonal)에서만 children을 보인다. 헤더의 ⚙처럼 2a 전용인 셸 요소에 쓴다. */
export function ThisMonthOnly({ children }: { children: React.ReactNode }) {
  return useIsActive(routes.seasonal.root, { exact: true }) ? children : null
}
