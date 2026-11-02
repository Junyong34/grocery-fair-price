// react-device-check에서 가져와 React 19 환경에 맞춤. 출처와 이용 조건: ./README.md, ./LICENSE
import type { DeviceInfo } from "./types"
import { isServer } from "./env"
import { listen, unlisten } from "./media"
import { getStaticInfo, SERVER_STATIC } from "./static"

export const SERVER_SNAPSHOT: DeviceInfo = Object.freeze({
  ...SERVER_STATIC,
  isTouchPrimary: false,

  orientation: "landscape",
  isHydrated: false,
})

export const getServerSnapshot = (): DeviceInfo => SERVER_SNAPSHOT

const TOUCH_QUERY = "(pointer: coarse)"
const PORTRAIT_QUERY = "(orientation: portrait)"

let snapshot: DeviceInfo | null = null
const listeners = new Set<() => void>()
let mqls: MediaQueryList[] = []

function compute(): DeviceInfo {
  return {
    ...getStaticInfo(),
    isTouchPrimary: window.matchMedia(TOUCH_QUERY).matches,
    orientation: window.matchMedia(PORTRAIT_QUERY).matches
      ? "portrait"
      : "landscape",
    isHydrated: true,
  }
}

export function getSnapshot(): DeviceInfo {
  if (snapshot === null) snapshot = compute()
  return snapshot
}

function onChange(): void {
  const next = compute()
  if (
    snapshot === null ||
    next.isTouchPrimary !== snapshot.isTouchPrimary ||
    next.orientation !== snapshot.orientation
  ) {
    snapshot = next
    listeners.forEach((l) => l())
  }
}

export function subscribe(listener: () => void): () => void {
  const isFirst = listeners.size === 0

  listeners.add(listener)
  if (!isServer && isFirst) {
    mqls = [window.matchMedia(TOUCH_QUERY), window.matchMedia(PORTRAIT_QUERY)]
    mqls.forEach((m) => listen(m, onChange))

    onChange()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      mqls.forEach((m) => unlisten(m, onChange))
      mqls = []
    }
  }
}

export function resetStoreForTesting(): void {
  snapshot = null
  listeners.clear()
  mqls.forEach((m) => unlisten(m, onChange))
  mqls = []
}
