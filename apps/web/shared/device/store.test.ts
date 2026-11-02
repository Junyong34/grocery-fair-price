import { afterEach, describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import { renderToString } from "react-dom/server"

// 브라우저 전역을 읽는 모듈을 각 환경에서 새로 불러온다.
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe("기기 구독과 서버 렌더링", () => {
  it("브라우저 없이도 훅을 렌더링하고 안정적인 기본값을 반환한다", async () => {
    const { useDevice } = await import("../use-device")
    function Probe() {
      return createElement("span", null, JSON.stringify(useDevice()))
    }
    const html = renderToString(createElement(Probe))
    expect(html).toContain("&quot;isHydrated&quot;:false")
    expect(html).toContain("&quot;type&quot;:&quot;desktop&quot;")
    const { getServerSnapshot } = await import("./store")
    expect(getServerSnapshot()).toBe(getServerSnapshot())
  })

  it("방향·포인터 변경을 알리고 마지막 구독 해제 시 리스너를 정리한다", async () => {
    const touchListeners = new Set<() => void>()
    const portraitListeners = new Set<() => void>()
    function media(listeners: Set<() => void>) {
      return {
        matches: false,
        addEventListener: (_: string, callback: () => void) =>
          listeners.add(callback),
        removeEventListener: (_: string, callback: () => void) =>
          listeners.delete(callback),
      }
    }
    const touch = media(touchListeners)
    const portrait = media(portraitListeners)
    vi.stubGlobal("window", {
      matchMedia: (query: string) =>
        query.includes("pointer") ? touch : portrait,
    })
    vi.stubGlobal("navigator", { userAgent: "iPhone", maxTouchPoints: 5 })
    const { getSnapshot, subscribe } = await import("./store")
    expect(getSnapshot()).toMatchObject({ isMobile: true, isHydrated: true })
    expect(getSnapshot()).toBe(getSnapshot())
    const first = vi.fn()
    const stopFirst = subscribe(first)
    const stopSecond = subscribe(vi.fn())
    touch.matches = true
    touchListeners.forEach((notify) => notify())
    expect(first).toHaveBeenCalledOnce()
    expect(getSnapshot().isTouchPrimary).toBe(true)
    portrait.matches = true
    portraitListeners.forEach((notify) => notify())
    expect(getSnapshot().orientation).toBe("portrait")
    stopFirst()
    expect(touchListeners.size).toBe(1)
    stopSecond()
    expect(touchListeners.size).toBe(0)
    expect(portraitListeners.size).toBe(0)
    portrait.matches = false
    const stopThird = subscribe(vi.fn())
    expect(getSnapshot().orientation).toBe("landscape")
    stopThird()
  })
})
