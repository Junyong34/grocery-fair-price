// react-device-check에서 가져와 React 19 환경에 맞춤. 출처와 이용 조건: ./README.md, ./LICENSE
import type { DetectionInput, DetectOptions, DeviceType, OS } from "./types"

const UA_DATA_PLATFORM_MAP: Record<string, OS> = {
  Android: "android",
  "Chrome OS": "linux",
  iOS: "ios",
  Linux: "linux",
  macOS: "macos",
  Windows: "windows",
}

const PHONE_SCREEN_MAX = 600

const TV_UA = /\bTV\b|SmartTV|GoogleTV|CrKey|Roku|\bAFT[A-Z0-9]|BRAVIA/

function sniffOS(ua: string): OS {
  if (/iPhone|iPad|iPod/.test(ua)) return "ios"
  if (/Android/.test(ua)) return "android"
  if (/Mac/.test(ua)) return "macos"
  if (/Windows/.test(ua)) return "windows"
  if (/Linux|X11|CrOS/.test(ua)) return "linux"
  return "unknown"
}

export function detectDevice(
  input?: DetectionInput,
  options?: DetectOptions
): { type: DeviceType; os: OS } {
  const fallback = {
    type: options?.fallback?.type ?? ("desktop" as DeviceType),
    os: options?.fallback?.os ?? ("unknown" as OS),
  }

  if (!input || (!input.ua && !input.uaData)) return fallback

  const ua = input.ua ?? ""
  const maxTouchPoints = input.maxTouchPoints ?? 0
  const uaData = input.uaData

  if (uaData && typeof uaData.mobile === "boolean") {
    let os = UA_DATA_PLATFORM_MAP[uaData.platform ?? ""] ?? sniffOS(ua)

    if (os === "linux" && /SamsungBrowser/.test(ua)) os = "android"
    if (uaData.mobile) return { type: "mobile", os }
    if (os === "android") {
      return {
        type: /Android/.test(ua) && !TV_UA.test(ua) ? "tablet" : "desktop",
        os,
      }
    }

    return { type: "desktop", os }
  }

  if (/iPhone|iPod/.test(ua)) return { type: "mobile", os: "ios" }
  if (/iPad/.test(ua)) return { type: "tablet", os: "ios" }

  if (/Mac/.test(ua) || (input.platform ?? "").indexOf("Mac") === 0) {
    if (maxTouchPoints > 1) {
      const s = input.screen
      const shortSide = s ? Math.min(s.width, s.height) : Infinity
      return {
        type: shortSide < PHONE_SCREEN_MAX ? "mobile" : "tablet",
        os: "ios",
      }
    }
    return { type: "desktop", os: "macos" }
  }

  if (/Android/.test(ua)) {
    if (TV_UA.test(ua)) return { type: "desktop", os: "android" }

    return {
      type: /Mobi|Opera Mini/.test(ua) ? "mobile" : "tablet",
      os: "android",
    }
  }

  if (/OpenHarmony/.test(ua)) {
    return { type: /Tablet/.test(ua) ? "tablet" : "mobile", os: "unknown" }
  }

  if (/Mobi/.test(ua)) return { type: "mobile", os: sniffOS(ua) }

  if (/Windows/.test(ua)) return { type: "desktop", os: "windows" }

  if (/Linux|X11|CrOS/.test(ua)) {
    return {
      type: "desktop",
      os: /SamsungBrowser/.test(ua) ? "android" : "linux",
    }
  }

  return fallback
}
