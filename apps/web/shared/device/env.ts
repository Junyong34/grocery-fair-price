// react-device-check에서 가져와 React 19 환경에 맞춤. 출처와 이용 조건: ./README.md, ./LICENSE
import type { DetectionInput, UADataLike } from "./types"

export const isServer =
  typeof window === "undefined" || typeof navigator === "undefined"

export function getNavigatorInput(): DetectionInput | undefined {
  if (isServer) return undefined
  const nav = navigator as Navigator & { userAgentData?: UADataLike }
  return {
    ua: nav.userAgent,
    uaData: nav.userAgentData,
    maxTouchPoints: nav.maxTouchPoints,
    platform: nav.platform,
    screen:
      typeof screen !== "undefined" && screen
        ? { width: screen.width, height: screen.height }
        : undefined,
  }
}
