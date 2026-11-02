import { describe, expect, it } from "vitest"

import { canShowInstallPrompt, INSTALL_SNOOZE_MS } from "./install-prompt-state"

const now = 1_800_000_000_000

describe("홈 화면 설치 안내 기록", () => {
  it("닫은 뒤 7일이 지나기 전에는 숨기고 만료 시각부터 다시 보여준다", () => {
    expect(INSTALL_SNOOZE_MS).toBe(7 * 24 * 60 * 60 * 1000)
    const preferences = {
      installed: false,
      dismissedUntil: now + INSTALL_SNOOZE_MS,
    }
    expect(canShowInstallPrompt(preferences, now)).toBe(false)
    expect(
      canShowInstallPrompt(preferences, preferences.dismissedUntil - 1)
    ).toBe(false)
    expect(canShowInstallPrompt(preferences, preferences.dismissedUntil)).toBe(
      true
    )
  })

  it("설치를 완료한 기기는 닫기 기한이 지나도 다시 안내하지 않는다", () => {
    expect(
      canShowInstallPrompt({ installed: true, dismissedUntil: 0 }, now)
    ).toBe(false)
    expect(
      canShowInstallPrompt({ installed: false, dismissedUntil: 0 }, now)
    ).toBe(true)
  })
})
