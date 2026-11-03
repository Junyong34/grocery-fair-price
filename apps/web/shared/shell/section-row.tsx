"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { useScrolledPast } from "./use-scrolled-past"

// 구간 줄(.scratch/shell-unify/spec.md 4장): 탭 줄(없으면 헤더) 아래에 한 줄 더 고정되는 얇은 줄(40px).
// 본문의 원래 줄(큰 달 타임라인 · 명절 칩 · 제목 줄 · 검색창)이 화면 위로 지나가면 나타나고, 다시 보이면 사라진다.

/** 원래 줄(id=watch)이 지나가면 나타나는 고정 구간 줄. belowTabs면 제철달력 탭 줄 아래에 붙는다. */
export function SectionRow({
  watch,
  belowTabs = false,
  label,
  children,
}: {
  watch: string
  belowTabs?: boolean
  label: string
  children: React.ReactNode
}) {
  const shown = useScrolledPast(watch, { belowTabs })
  const scroller = useRef<HTMLDivElement>(null)
  // 나타날 때 지금 칩(11월 등)이 줄 가운데 오게 가로로만 옮긴다(페이지는 움직이지 않는다).
  useEffect(() => {
    const box = scroller.current
    const chip = box?.querySelector<HTMLElement>("[aria-current]")
    if (!shown || !box || !chip) return
    box.scrollLeft = chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2
  }, [shown])
  return (
    <nav
      aria-label={label}
      aria-hidden={!shown}
      inert={!shown}
      style={{
        top: belowTabs
          ? "calc(var(--shell-top) + var(--tabs-h))"
          : "var(--shell-top)",
      }}
      className={cn(
        "fixed inset-x-0 z-(--z-sticky) h-10 border-b border-hairline bg-canvas/94 backdrop-blur-md",
        "motion-safe:transition-[top,opacity,translate] motion-safe:duration-300",
        shown
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0"
      )}
    >
      <div
        ref={scroller}
        className="relative mx-auto flex h-full max-w-[1080px] items-center gap-1.5 overflow-x-auto px-[18px] [scrollbar-width:none] lg:px-6"
      >
        {children}
      </div>
    </nav>
  )
}

const CHIP =
  "relative inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] whitespace-nowrap text-stone no-underline transition-colors after:absolute after:inset-x-0 after:-inset-y-1.5 hover:text-ink aria-[current]:bg-gold-soft aria-[current]:font-semibold aria-[current]:text-espresso"

/** 구간 줄의 칩. 보이는 높이는 32px이고, 누르는 영역은 위아래로 넓혀 44px다. */
export function SectionChip({
  href,
  current,
  onClick,
  children,
}: {
  href: string
  current: boolean
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
  children: React.ReactNode
}) {
  // 같은 화면 안 섹션으로 가는 칩(#id)은 페이지 이동이 아니라 a를 쓴다.
  const Anchor = href.startsWith("#") ? "a" : Link
  return (
    <Anchor
      href={href}
      aria-current={current ? "true" : undefined}
      onClick={onClick}
      className={CHIP}
    >
      {children}
    </Anchor>
  )
}
