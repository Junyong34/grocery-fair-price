"use client"

import { Search } from "lucide-react"
import { overlay } from "overlay-kit"
import { lazy, Suspense, useEffect } from "react"

// 검색 다이얼로그(cmdk·Dialog)는 처음 열 때 불러온다. 버튼에 포인터나 초점이 오면 미리 받아 둔다.
const loadDialog = () => import("./food-search-dialog")
const LazyFoodSearchDialog = lazy(() =>
  loadDialog().then(({ FoodSearchDialog }) => ({ default: FoodSearchDialog }))
)

/** 손가락은 hover가 없어 누르는 순간(pointerdown)에 받기 시작한다. */
const preload = {
  onPointerEnter: () => void loadDialog(),
  onPointerDown: () => void loadDialog(),
  onFocus: () => void loadDialog(),
}

export function openFoodSearch() {
  // 오버레이는 클릭 안에서 바로 연다. 다이얼로그 코드가 도착하기 전에는 아무것도 그리지 않는다.
  overlay.open(({ isOpen, close, unmount }) => (
    <Suspense>
      <LazyFoodSearchDialog open={isOpen} onClose={close} onExited={unmount} />
    </Suspense>
  ))
}

/** 모바일 헤더의 검색 버튼. */
export function MobileSearchButton() {
  return (
    <button
      type="button"
      onClick={openFoodSearch}
      {...preload}
      aria-label="음식 검색"
      className="grid size-10 place-items-center rounded-full text-ink hover:bg-surface"
    >
      <Search aria-hidden size={20} strokeWidth={1.6} />
    </button>
  )
}

/**
 * 데스크톱 상단 바의 "음식 검색" 입력 모양 버튼. 누르거나 어디서든 "/"를 누르면 검색이 열린다.
 * 입력란에 글자를 치는 중이면 "/"를 가로채지 않는다.
 */
export function DesktopSearchButton() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable=true]"))
        return
      event.preventDefault()
      openFoodSearch()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <button
      type="button"
      onClick={openFoodSearch}
      {...preload}
      aria-keyshortcuts="/"
      className="flex h-9 w-[200px] items-center gap-2 rounded-full border border-silver/50 bg-hairline/50 px-3.5 text-left text-sm text-stone transition-colors hover:bg-hairline"
    >
      <Search aria-hidden size={16} strokeWidth={1.6} />
      <span className="flex-1">음식 검색</span>
      <kbd className="rounded border border-silver/70 bg-canvas/70 px-1.5 font-sans text-[11px] text-stone">
        /
      </kbd>
    </button>
  )
}
