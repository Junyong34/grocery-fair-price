// react-device-check에서 가져와 React 19 환경에 맞춤. 출처와 이용 조건: ./README.md, ./LICENSE
import type { StaticDeviceInfo } from "./types"
import { detectDevice } from "./detect"
import { getNavigatorInput, isServer } from "./env"

export const SERVER_STATIC: StaticDeviceInfo = Object.freeze({
  type: "desktop",
  os: "unknown",
  isMobile: false,
  isTablet: false,
  isDesktop: true,
})

let cache: StaticDeviceInfo | null = null

export function getStaticInfo(): StaticDeviceInfo {
  if (cache) return cache
  if (isServer) return SERVER_STATIC
  const { type, os } = detectDevice(getNavigatorInput())
  cache = {
    type,
    os,
    isMobile: type === "mobile",
    isTablet: type === "tablet",
    isDesktop: type === "desktop",
  }
  return cache
}

export function resetStaticInfoForTesting(): void {
  cache = null
}
