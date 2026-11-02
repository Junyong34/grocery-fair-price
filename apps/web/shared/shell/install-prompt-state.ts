export type InstallPreferences = { installed: boolean; dismissedUntil: number }

export const INSTALL_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

/** 설치 기록은 기한 없이, 닫기 기록은 만료 시각 전까지만 안내를 막는다. */
export function canShowInstallPrompt(
  preferences: InstallPreferences,
  now: number
): boolean {
  return !preferences.installed && now >= preferences.dismissedUntil
}
