"use client"

import { ArrowDownToLine, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { INSTALL_COPY } from "@workspace/seasonal/data/copy"
import { Button } from "@workspace/ui/components/button"

import { deviceStore } from "@/shared/device-store"
import { useDevice } from "@/shared/use-device"

import {
  canShowInstallPrompt,
  INSTALL_SNOOZE_MS,
  migrateInstallPreferences,
  type InstallPreferences,
} from "./install-prompt-state"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const preferences = deviceStore<InstallPreferences>(
  "price:install-prompt",
  { installed: false, dismissedUntil: 0 },
  {
    version: 1,
    migrate: (persisted) => migrateInstallPreferences(persisted, Date.now()),
  }
)

/** 휴대폰 전용 플로팅 설치 안내. 설치창 준비 여부와 무관하게 버튼·카드 모양을 유지한다. */
export function InstallPrompt() {
  const { isHydrated, isMobile, os } = useDevice()
  const preferencesHydrated = preferences.useHydrated()
  const installedRecord = preferences.use((state) => state.installed)
  const dismissedUntil = preferences.use((state) => state.dismissedUntil)
  const [standalone, setStandalone] = useState<boolean | null>(null)
  const [eligible, setEligible] = useState(false)
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    null
  )
  const [installing, setInstalling] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [failed, setFailed] = useState(false)

  function markInstalled() {
    preferences.set({ installed: true })
    setInstallEvent(null)
  }

  useEffect(
    function subscribeToInstallation() {
      const displayMode = window.matchMedia("(display-mode: standalone)")
      function updateDisplayMode() {
        const runningAsApp =
          displayMode.matches ||
          ("standalone" in navigator && navigator.standalone === true)
        setStandalone(runningAsApp)
        if (runningAsApp) preferences.set({ installed: true })
      }
      function captureInstallPrompt(event: Event) {
        if (!isHydrated || !isMobile) return
        event.preventDefault()
        setInstallEvent(event as InstallPromptEvent)
      }
      function recordInstallation() {
        preferences.set({ installed: true })
        setInstallEvent(null)
      }
      updateDisplayMode()
      displayMode.addEventListener("change", updateDisplayMode)
      window.addEventListener("beforeinstallprompt", captureInstallPrompt)
      window.addEventListener("appinstalled", recordInstallation)
      return function unsubscribeFromInstallation() {
        displayMode.removeEventListener("change", updateDisplayMode)
        window.removeEventListener("beforeinstallprompt", captureInstallPrompt)
        window.removeEventListener("appinstalled", recordInstallation)
      }
    },
    [isHydrated, isMobile]
  )

  useEffect(
    function scheduleSnoozeExpiry() {
      if (!preferencesHydrated) return
      function refreshEligibility() {
        setEligible(
          canShowInstallPrompt(
            { installed: installedRecord, dismissedUntil },
            Date.now()
          )
        )
      }
      refreshEligibility()
      const remaining = dismissedUntil - Date.now()
      const timer =
        remaining > 0
          ? window.setTimeout(
              refreshEligibility,
              Math.min(remaining, INSTALL_SNOOZE_MS)
            )
          : undefined
      document.addEventListener("visibilitychange", refreshEligibility)
      return function stopSnoozeTimer() {
        window.clearTimeout(timer)
        document.removeEventListener("visibilitychange", refreshEligibility)
      }
    },
    [preferencesHydrated, installedRecord, dismissedUntil]
  )

  function snooze() {
    preferences.set({ dismissedUntil: Date.now() + INSTALL_SNOOZE_MS })
    setEligible(false)
    setShowInstructions(false)
  }

  async function install() {
    if (installing) return
    if (!installEvent || os === "ios") {
      setShowInstructions(true)
      return
    }
    setInstalling(true)
    setFailed(false)
    try {
      await installEvent.prompt()
      const { outcome } = await installEvent.userChoice
      if (outcome === "accepted") markInstalled()
      else snooze()
    } catch {
      setFailed(true)
      setShowInstructions(true)
    } finally {
      // 같은 이벤트의 설치창은 한 번만 열 수 있다.
      setInstallEvent(null)
      setInstalling(false)
    }
  }

  if (
    !isHydrated ||
    !isMobile ||
    !preferencesHydrated ||
    installedRecord ||
    !eligible ||
    standalone !== false
  )
    return null

  return createPortal(
    <aside
      aria-label={INSTALL_COPY.label}
      className="fixed bottom-[calc(max(14px,env(safe-area-inset-bottom))+88px)] left-1/2 z-(--z-dock) max-h-[calc(100svh-160px)] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 overflow-y-auto rounded-2xl bg-forest p-5 text-canvas shadow-xl shadow-ink/20"
    >
      <div className="flex items-start gap-3 pr-8">
        <Image
          src="/images/brand/logo-symbol-ivory-512.png"
          alt=""
          width={40}
          height={40}
          unoptimized
          className="size-10 shrink-0"
        />
        <div className="min-w-0">
          <h2 className="text-base leading-6 font-semibold">
            {INSTALL_COPY.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-canvas/85">
            {INSTALL_COPY.description}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 size-11 p-0"
        style={{ color: "var(--color-canvas)" }}
        aria-label={INSTALL_COPY.close}
        title={INSTALL_COPY.close}
        onClick={snooze}
      >
        <X size={18} aria-hidden="true" />
      </Button>
      <Button
        type="button"
        className="mt-4 min-h-11 w-full"
        style={{
          backgroundColor: "var(--color-canvas)",
          color: "var(--color-forest)",
        }}
        loading={installing}
        disabled={installing}
        onClick={install}
        aria-expanded={showInstructions}
        aria-controls={showInstructions ? "install-instructions" : undefined}
      >
        <ArrowDownToLine size={16} aria-hidden="true" />
        {INSTALL_COPY.install}
      </Button>
      {showInstructions && (
        <div
          id="install-instructions"
          className="mt-4 border-t border-canvas/20 pt-4"
        >
          <p role="status" className="text-sm leading-relaxed text-canvas/90">
            {failed
              ? INSTALL_COPY.failed
              : os === "ios"
                ? INSTALL_COPY.ios
                : INSTALL_COPY.browser}
          </p>
          <button
            type="button"
            className="mt-2 min-h-11 text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas"
            onClick={markInstalled}
          >
            {INSTALL_COPY.confirmed}
          </button>
        </div>
      )}
    </aside>,
    document.body
  )
}
