"use client"

import { Check, Share2 } from "lucide-react"
import { overlay } from "overlay-kit"
import { useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Toast, ToastProvider, ToastTitle, ToastViewport } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"

import { SITE_CONFIG } from "@/shared/meta"

/** 복사됨 표시(✓)와 토스트가 머무는 시간 */
const FEEDBACK_MS = 2200

/** 공유 결과 토스트(cojeev Toast). 모바일은 하단 내비 위, 데스크톱은 오른쪽 아래(열린 시트의 제목 줄을 가리지 않게). */
function showShareToast(message: string) {
  overlay.open(({ isOpen, close, unmount }) => (
    <ToastProvider duration={FEEDBACK_MS} swipeDirection="down">
      <Toast
        open={isOpen}
        onOpenChange={(open) => {
          if (open) return
          close()
          setTimeout(unmount, 300)
        }}
      >
        <ToastTitle className="font-normal">{message}</ToastTitle>
      </Toast>
      <ToastViewport className="right-[18px]! bottom-[78px]! left-[18px]! w-auto! lg:right-6! lg:bottom-6! lg:left-auto! lg:w-[340px]!" />
    </ToastProvider>
  ))
}

/**
 * 공유 버튼. 공유할 대상이 뚜렷한 화면의 제목 줄 오른쪽에 둔다(월별·계절·명절 상세, 품종 상세 시트).
 * 이달(모바일)은 제목 줄이 없어 월 레일 아래에 둔다(MonthRail). 월별·계절 목록과 나의 식탁(먹음 기록은 기기에만 있어 링크를 받은 사람은 빈 식탁을 본다)에는 두지 않는다.
 * 공유 시트(Web Share API)가 있으면 그것을, 없으면 주소를 복사하고 토스트로 알린다.
 */
export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copied])

  const share = async () => {
    const url = window.location.href
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: document.title || SITE_CONFIG.titleDefault, text: SITE_CONFIG.description, url })
        return
      } catch (error) {
        // 사용자가 공유 창을 닫았으면 아무것도 하지 않는다. 다른 실패는 복사로 넘어간다.
        if (error instanceof Error && error.name === "AbortError") return
      }
    }
    try {
      // clipboard는 https(또는 localhost)에서만 있다. 없으면 아래 실패 안내로 간다.
      await navigator.clipboard.writeText(url)
      setCopied(true)
      showShareToast("링크를 복사했어요")
    } catch {
      showShareToast("링크를 복사하지 못했어요. 주소창의 주소를 복사해 주세요")
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="공유하기"
      onClick={share}
      className={cn("size-10 px-0", copied ? "text-gold hover:text-gold" : "text-ink", className)}
    >
      {copied ? <Check aria-hidden size={20} strokeWidth={2} /> : <Share2 aria-hidden size={20} strokeWidth={1.6} />}
    </Button>
  )
}
