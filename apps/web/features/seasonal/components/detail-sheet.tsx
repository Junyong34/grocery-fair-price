"use client"

import { useRouter } from "next/navigation"
import { useSyncExternalStore } from "react"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet"

import { ShareButton } from "./share-button"

const DESKTOP = "(min-width: 1024px)"

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** 데스크톱(≥1024px)인지. 서버와 하이드레이션 때는 모바일로 본다. */
function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  )
}

/**
 * 제철 화면 안에서 품종이나 에디션을 누르면 뜨는 상세 껍데기(인터셉팅 라우트). 모바일은 하단 시트, 데스크톱은 오른쪽 패널이다.
 * 닫으면 뒤로 가서 원래 화면(스크롤 위치 그대로)으로 돌아간다. action은 제목 줄 오른쪽이고 기본은 공유 버튼이다.
 */
export function DetailSheet({ title, action = <ShareButton />, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  const router = useRouter()
  const close = () => router.back()

  if (useIsDesktop()) {
    return (
      <Sheet open onOpenChange={(open) => !open && close()}>
        <SheetContent
          className="w-[min(440px,calc(100%-56px))] focus:outline-none"
          aria-describedby={undefined}
          // 첫 초점이 공유 버튼에 가면 선택된 것처럼 보인다. 패널 자체에 초점을 두고 Tab으로 버튼에 간다.
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            ;(event.currentTarget as HTMLElement).focus()
          }}
        >
          <SheetHeader className="flex flex-row items-center justify-between gap-4">
            <SheetTitle className="font-heading text-[32px] font-bold">{title}</SheetTitle>
            {action && <div className="shrink-0">{action}</div>}
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <BottomSheet
      open
      onClose={close}
      title={<span className="font-heading text-[28px] font-bold">{title}</span>}
      action={action}
    >
      <div className="overflow-y-auto pb-4">{children}</div>
    </BottomSheet>
  )
}
