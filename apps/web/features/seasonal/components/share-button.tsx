"use client"

import { Check, Share2 } from "lucide-react"
import { overlay } from "overlay-kit"
import { useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { SITE_CONFIG } from "@/shared/meta"

/** 공유 토스트 알림을 띄우는 헬퍼 */
export function showShareToast(message = "링크가 복사되었습니다") {
  overlay.open(({ isOpen, close, unmount }) => {
    return (
      <ShareToastNotification
        isOpen={isOpen}
        message={message}
        onClose={close}
        onUnmount={unmount}
      />
    )
  })
}

function ShareToastNotification({
  isOpen,
  message,
  onClose,
  onUnmount,
}: {
  isOpen: boolean
  message: string
  onClose: () => void
  onUnmount: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 2200)
    return () => clearTimeout(timer)
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      const exitTimer = setTimeout(onUnmount, 300)
      return () => clearTimeout(exitTimer)
    }
  }, [isOpen, onUnmount])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 bottom-20 z-(--z-dialog) mx-auto flex w-fit max-w-[90vw] items-center gap-2 rounded-full border border-silver/60 bg-espresso/95 px-4 py-2.5 text-sm text-canvas shadow-lg backdrop-blur-md transition-all duration-300",
        isOpen
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-2 opacity-0 scale-95"
      )}
    >
      <Check size={16} strokeWidth={2.2} className="text-gold-soft" aria-hidden />
      <span>{message}</span>
    </div>
  )
}

export interface ShareButtonProps {
  /** 공유할 대상 URL (없으면 현재 창의 URL) */
  url?: string
  /** 공유 제목 */
  title?: string
  /** 공유 본문 설명 */
  text?: string
  className?: string
  size?: "default" | "sm"
  /** 아이콘 크기 (기본값 20) */
  iconSize?: number
}

/**
 * 공통 공유하기 버튼.
 * 모바일/지원 브라우저: Web Share API (OS 네이티브 공유 시트)
 * 데스크톱/미지원 브라우저: URL 클립보드 복사 + 토스트 알림
 */
export function ShareButton({
  url,
  title,
  text,
  className,
  size = "default",
  iconSize = 20,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    let targetUrl = url
    if (!targetUrl && typeof window !== "undefined") {
      targetUrl = window.location.href
    }
    if (!targetUrl) {
      targetUrl = SITE_CONFIG.url
    } else if (targetUrl.startsWith("/")) {
      targetUrl = `${SITE_CONFIG.url}${targetUrl}`
    }

    const shareData = {
      title: title || document.title || SITE_CONFIG.titleDefault,
      text: text || SITE_CONFIG.description,
      url: targetUrl,
    }

    // Web Share API가 지원되는 경우 (주로 모바일 기기)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        // 사용자가 공유 창을 닫은 경우(AbortError)는 복사 피드백을 생략
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
      }
    }

    // Web Share API를 지원하지 않거나 실패 시 클립보드 복사 fallback
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(targetUrl)
        setCopied(true)
        showShareToast("링크가 클립보드에 복사되었습니다")
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // 클립보드 복사도 실패한 경우 fallback
      showShareToast("주소를 복사할 수 없습니다")
    }
  }

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "sm" : "sm"}
      aria-label="공유하기"
      onClick={handleShare}
      className={cn(
        "size-10 px-0 transition-colors",
        copied ? "text-gold hover:text-gold" : "text-stone hover:text-ink",
        className
      )}
    >
      {copied ? (
        <Check aria-hidden size={iconSize} strokeWidth={2} />
      ) : (
        <Share2 aria-hidden size={iconSize} strokeWidth={1.6} />
      )}
    </Button>
  )
}
