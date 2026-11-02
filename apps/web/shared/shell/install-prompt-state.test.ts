import { describe, expect, it } from "vitest"

import {
  canShowInstallPrompt,
  INSTALL_SNOOZE_MS,
  migrateInstallPreferences,
} from "./install-prompt-state"

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

  it("기존 영구 닫기 기록을 마이그레이션 시점부터 7일 숨김으로 옮긴다", () => {
    expect(migrateInstallPreferences({ dismissed: true }, now)).toEqual({
      installed: false,
      dismissedUntil: now + INSTALL_SNOOZE_MS,
    })
    expect(migrateInstallPreferences({ dismissed: false }, now)).toEqual({
      installed: false,
      dismissedUntil: 0,
    })
  })

  it("설치 기록과 유효한 만료 시각을 보존하고 잘못된 저장값은 기본값으로 복구한다", () => {
    expect(
      migrateInstallPreferences({ installed: true, dismissedUntil: now }, now)
    ).toEqual({ installed: true, dismissedUntil: now })
    for (const value of [
      null,
      [],
      "broken",
      { installed: "true", dismissedUntil: "tomorrow" },
      { dismissedUntil: Infinity },
    ]) {
      expect(migrateInstallPreferences(value, now)).toEqual({
        installed: false,
        dismissedUntil: 0,
      })
    }
  })
})
