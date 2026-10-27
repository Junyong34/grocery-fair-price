"use client"

import Link from "next/link"
import { overlay } from "overlay-kit"
import { useEffect, useState } from "react"

import { Toast, ToastAction, ToastProvider, ToastTitle, ToastViewport } from "@workspace/ui/components/toast"

import { PRICE_COPY } from "@workspace/price/copy"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { useBasketStore } from "../stores/basket-store"

const TOAST_MS = 3200

/**
 * 화면 키보드가 가린 높이(px). 검색 중에는 키보드가 하단 내비를 덮으므로 토스트를 키보드 위로 올린다.
 * visualViewport가 없거나 키보드가 없으면 0.
 */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)))
    update()
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
    }
  }, [])
  return inset
}

function BasketToastViewport() {
  const inset = useKeyboardInset()
  return (
    <ToastViewport
      // 모바일은 하단 내비 위, 키보드가 떠 있으면 키보드 바로 위. 데스크톱은 오른쪽 아래.
      style={inset ? { bottom: inset + 12 } : undefined}
      className="right-[18px]! bottom-[82px]! left-[18px]! w-auto! lg:right-6! lg:bottom-6! lg:left-auto! lg:w-[360px]!"
    />
  )
}

let closeLast: (() => void) | null = null

/** "배추를 담았어요 · 목록 보기". 새로 담으면 앞 토스트를 닫는다. */
function showBasketToast(message: string) {
  closeLast?.()
  overlay.open(({ isOpen, close, unmount }) => {
    closeLast = close
    return (
      <ToastProvider duration={TOAST_MS} swipeDirection="down">
        <Toast
          open={isOpen}
          onOpenChange={(open) => {
            if (open) return
            close()
            setTimeout(unmount, 300)
          }}
        >
          <ToastTitle className="flex-1 font-normal">{message}</ToastTitle>
          <ToastAction altText={PRICE_COPY.toast.openList} asChild>
            <Link href={routes.price.basket} onClick={close} className="shrink-0 text-sm font-semibold text-gold-soft underline-offset-2 hover:underline">
              {PRICE_COPY.toast.openList}
            </Link>
          </ToastAction>
        </Toast>
        <BasketToastViewport />
      </ToastProvider>
    )
  })
}

/** 담거나 뺀다. 담으면 토스트를 띄운다. */
export function toggleBasket(variety: VarietySummary, added: boolean) {
  const { add, remove } = useBasketStore.getState()
  if (added) return remove(variety.id)
  add(variety)
  showBasketToast(PRICE_COPY.toast.added(variety.name))
}
