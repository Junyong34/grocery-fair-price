"use client"

/** 지금 화면의 탭(하단 내비 칸 · 탭 줄)을 다시 누르면 이동하지 않고 맨 위로 올린다(.scratch/shell-unify/spec.md 4-2). */
export function scrollToTopIfCurrent(event: React.MouseEvent<HTMLAnchorElement>, current: boolean): void {
  if (!current || event.metaKey || event.ctrlKey || event.shiftKey) return
  event.preventDefault()
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
}
