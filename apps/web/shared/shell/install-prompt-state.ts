export type InstallPreferences = { installed: boolean; dismissedUntil: number }

export const INSTALL_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

/** 설치 기록은 기한 없이, 닫기 기록은 만료 시각 전까지만 안내를 막는다. */
export function canShowInstallPrompt(
  preferences: InstallPreferences,
  now: number
): boolean {
  return !preferences.installed && now >= preferences.dismissedUntil
}

/** 기존 dismissed 키의 영구 숨김을 7일 숨김으로 옮긴다. 저장소 키 자체는 유지한다. */
export function migrateInstallPreferences(
  persisted: unknown,
  now: number
): InstallPreferences {
  if (!persisted || typeof persisted !== "object" || Array.isArray(persisted))
    return { installed: false, dismissedUntil: 0 }
  const installed = "installed" in persisted && persisted.installed === true
  const dismissedUntil =
    "dismissedUntil" in persisted &&
    typeof persisted.dismissedUntil === "number" &&
    Number.isFinite(persisted.dismissedUntil) &&
    persisted.dismissedUntil > 0
      ? persisted.dismissedUntil
      : "dismissed" in persisted && persisted.dismissed === true
        ? now + INSTALL_SNOOZE_MS
        : 0
  return { installed, dismissedUntil }
}
