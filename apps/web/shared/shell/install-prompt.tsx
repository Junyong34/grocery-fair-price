"use client"

import { X } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { INSTALL_COPY } from "@workspace/seasonal/data/copy"
import { Button } from "@workspace/ui/components/button"

import { deviceStore } from "@/shared/device-store"
import { useDevice } from "@/shared/use-device"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const preferences = deviceStore("price:install-prompt", { dismissed: false })

/** 휴대폰에서만 설치를 안내한다. 데스크톱·태블릿·설치된 앱 창에는 표시하지 않는다. */
export function InstallPrompt() {
  const { isHydrated, isMobile, os } = useDevice()
  const preferencesHydrated = preferences.useHydrated()
  const dismissed = preferences.use((state) => state.dismissed)
  const [installed, setInstalled] = useState<boolean | null>(null)
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    null
  )
  const [installing, setInstalling] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(
    function subscribeToInstallation() {
      const standalone = window.matchMedia("(display-mode: standalone)")
      function updateInstalled() {
        setInstalled(
          standalone.matches ||
            ("standalone" in navigator && navigator.standalone === true)
        )
      }
      function captureInstallPrompt(event: Event) {
        // 기본 설치 안내를 제어하는 것도 휴대폰에서만 한다. PC 브라우저의 기본 메뉴는 그대로 둔다.
        if (!isHydrated || !isMobile) return
        event.preventDefault()
        setInstallEvent(event as InstallPromptEvent)
      }
      function markInstalled() {
        setInstalled(true)
        setInstallEvent(null)
      }
      updateInstalled()
      standalone.addEventListener("change", updateInstalled)
      window.addEventListener("beforeinstallprompt", captureInstallPrompt)
      window.addEventListener("appinstalled", markInstalled)
      return function unsubscribeFromInstallation() {
        standalone.removeEventListener("change", updateInstalled)
        window.removeEventListener("beforeinstallprompt", captureInstallPrompt)
        window.removeEventListener("appinstalled", markInstalled)
      }
    },
    [isHydrated, isMobile]
  )

  async function install() {
    if (!installEvent || installing) return
    setInstalling(true)
    setFailed(false)
    try {
      await installEvent.prompt()
      const { outcome } = await installEvent.userChoice
      if (outcome === "accepted") setInstalled(true)
      else preferences.set({ dismissed: true })
    } catch {
      setFailed(true)
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
    dismissed ||
    installed !== false
  )
    return null

  const instructions = os === "ios" ? INSTALL_COPY.ios : INSTALL_COPY.browser
  return (
    <aside
      aria-label={INSTALL_COPY.label}
      className="mx-4 mt-4 flex gap-3 rounded-2xl border border-hairline bg-surface p-4 text-ink"
    >
      <Image
        src="/images/brand/favicon-green-192.png"
        alt=""
        width={44}
        height={44}
        unoptimized
        className="size-11 shrink-0 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <h2 className="text-sm leading-6 font-semibold">
          {INSTALL_COPY.title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-stone">
          {INSTALL_COPY.description}
        </p>
        {installEvent && os !== "ios" ? (
          <Button
            type="button"
            size="sm"
            className="mt-3"
            loading={installing}
            disabled={installing}
            onClick={install}
          >
            {INSTALL_COPY.install}
          </Button>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-stone">
            {instructions}
          </p>
        )}
        {failed && (
          <p role="status" className="mt-2 text-sm leading-relaxed text-stone">
            {INSTALL_COPY.failed}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="size-11 shrink-0 p-0"
        aria-label={INSTALL_COPY.close}
        onClick={() => preferences.set({ dismissed: true })}
      >
        <X size={18} aria-hidden="true" />
      </Button>
    </aside>
  )
}
