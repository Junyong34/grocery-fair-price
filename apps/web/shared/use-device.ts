"use client"

import { useSyncExternalStore } from "react"
import { getServerSnapshot, getSnapshot, subscribe } from "./device/store"
export type { DeviceInfo, DeviceType, OS, Orientation } from "./device/types"

/** 서버와 첫 하이드레이션은 desktop/unknown, isHydrated: false. 기기별 처리는 확인 후 실행한다. */
export function useDevice() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useDeviceType() {
  return useDevice().type
}

export function useOS() {
  return useDevice().os
}

export function useIsMobile() {
  return useDevice().isMobile
}

export function useIsTablet() {
  return useDevice().isTablet
}

export function useIsDesktop() {
  return useDevice().isDesktop
}
