"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

import { HeaderBar } from "./site-nav"

/**
 * 모바일 하위 헤더(.scratch/shell-unify/spec.md 3장): ‹ · 제목 · 액션 0~2개. 사이트 헤더의 바 자리에 늘 그려 로고 · 버튼을 가린다.
 * ‹는 앞 화면이 있으면 뒤로, 주소로 바로 들어왔으면 fallbackHref(그 화면의 부모)로 간다. 데스크톱(≥1024)은 헤더가 바 자리를 그리지 않는다.
 */
export function SubHeader({
  title,
  fallbackHref,
  actions,
  className,
}: {
  title: React.ReactNode
  fallbackHref: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <HeaderBar>
      <div
        data-header-bar=""
        className={cn(
          "pointer-events-auto flex h-full items-center gap-1.5",
          className
        )}
      >
        <BackButton fallbackHref={fallbackHref} />
        <p className="min-w-0 flex-1 truncate font-heading text-[19px] leading-tight font-bold text-ink">
          {title}
        </p>
        {actions && (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        )}
      </div>
    </HeaderBar>
  )
}

/** 하위 헤더의 ‹. 데스크톱 본문 뒤로 버튼도 같은 동작이 필요할 때 쓴다. */
export function BackButton({
  fallbackHref,
  className,
}: {
  fallbackHref: string
  className?: string
}) {
  const router = useRouter()
  const goBack = () => {
    // 같은 문서 안에서 이동한 앞 화면만 돌아간다. 외부 사이트에서 오거나 주소를 직접 열면 부모 화면으로 간다.
    const navigation = (
      window as Window & {
        navigation?: {
          currentEntry: { index: number } | null
          entries(): readonly { sameDocument: boolean }[]
        }
      }
    ).navigation
    // Navigation API가 없는 브라우저는 최초 문서 주소와 현재 경로가 다를 때만 앱 내 이동으로 본다.
    const documentEntry = performance.getEntriesByType("navigation")[0]
    const canGoBack = navigation?.currentEntry
      ? navigation.entries()[navigation.currentEntry.index - 1]
          ?.sameDocument === true
      : window.history.length > 1 &&
        documentEntry != null &&
        new URL(documentEntry.name).pathname !== window.location.pathname
    if (canGoBack) router.back()
    else router.replace(fallbackHref)
  }
  return (
    <button
      type="button"
      aria-label="뒤로"
      onClick={goBack}
      className={cn(
        "-ml-1 grid size-10 shrink-0 place-items-center rounded-full text-ink hover:bg-surface",
        className
      )}
    >
      <ChevronLeft aria-hidden size={24} />
    </button>
  )
}
