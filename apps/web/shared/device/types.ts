// react-device-check에서 가져와 React 19 환경에 맞춤. 출처와 이용 조건: ./README.md

export type DeviceType = "mobile" | "tablet" | "desktop"

export type OS = "ios" | "android" | "windows" | "macos" | "linux" | "unknown"

export type Orientation = "portrait" | "landscape"

export interface StaticDeviceInfo {
  type: DeviceType
  os: OS

  isMobile: boolean

  isTablet: boolean

  isDesktop: boolean
}

export interface DeviceInfo extends StaticDeviceInfo {
  isTouchPrimary: boolean

  orientation: Orientation

  isHydrated: boolean
}

export interface DetectionInput {
  ua?: string

  uaData?: UADataLike | null

  maxTouchPoints?: number

  platform?: string

  screen?: { width: number; height: number }
}

export interface UADataLike {
  mobile?: boolean
  platform?: string
}

export interface DetectOptions {
  fallback?: Partial<Pick<StaticDeviceInfo, "type" | "os">>
}
