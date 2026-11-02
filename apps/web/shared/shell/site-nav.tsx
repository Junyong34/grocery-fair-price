"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { cn } from "@workspace/ui/lib/utils"

import { BrandLogo } from "@/shared/brand-logo"
import { SITE_CONFIG } from "@/shared/meta"
import { routes } from "@/shared/routes"

import { activeMenuKey, MENUS } from "./menus"
import { NavLink } from "./nav-link"
import { headerScrollStep, INITIAL_HEADER_SCROLL } from "./header-scroll"
import { screenOf } from "./screens"
import { scrollToTopIfCurrent } from "./scroll-to-top"

/** 메뉴 칸 옆에 붙는 배지(담은 개수 등). 메뉴 key → 요소. 레이아웃이 넣는다. */
export type MenuBadges = Partial<Record<string, React.ReactNode>>

/** 하단 내비 칸 하나의 폭(px). 강조 배경이 칸 단위로 미끄러진다. 칸이 4개여도 375px에 들어간다(288px). */
const CELL = 72

/**
 * 모바일 하단 가운데 떠 있는 내비(cojeev Action Dock 모양을 따랐다).
 * 2차 탭과 같은 크림(gold-wash) 트레이에 아이콘·라벨을 세로로 놓고, 지금 메뉴 뒤에 둥근 강조 배경이 깔린다. 메뉴를 바꾸면 배경이 옆 칸으로 미끄러진다.
 */
export function FloatingNav({ badges = {} }: { badges?: MenuBadges }) {
  const activeKey = activeMenuKey(usePathname())
  const items = MENUS
  const active = items.findIndex(({ key }) => key === activeKey)
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-(--z-dock) mx-auto w-fit rounded-[24px] border border-gold-pale/45 bg-gold-wash/92 p-1 shadow-lg shadow-ink/10 backdrop-blur-md lg:hidden"
    >
      <div className="relative flex">
        {active >= 0 && (
          <span
            aria-hidden
            className="absolute inset-y-0 rounded-[20px] bg-gold-soft motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.34,1.3,.64,1)]"
            style={{ width: CELL, transform: `translateX(${active * CELL}px)` }}
          />
        )}
        {items.map(({ key, label, href, Icon }, i) => (
          <Link
            key={key}
            href={href}
            aria-current={i === active ? "page" : undefined}
            onClick={(event) => scrollToTopIfCurrent(event, i === active)}
            className={cn(
              "relative flex h-12 flex-col items-center justify-center gap-1 text-[11px] leading-none no-underline transition-colors duration-200",
              i === active ? "font-semibold text-espresso hover:text-espresso" : "text-stone hover:text-ink"
            )}
            style={{ width: CELL }}
          >
            <span className="relative">
              <Icon aria-hidden size={19} strokeWidth={i === active ? 1.9 : 1.6} />
              {badges[key] && <span className="absolute -top-1.5 left-3.5">{badges[key]}</span>}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

/** 모바일 헤더 바 자리의 id. HeaderBar가 이 자리에 포털로 그린다. */
export const HEADER_BAR_ID = "site-header-bar"

/**
 * 화면별 모바일 헤더 타입. children을 헤더의 바 자리에 그린다(마운트 뒤, 포털).
 * 화면을 떠나면(숨겨져도) 비운다. children이 보일 때 data-header-bar를 달면 로고 · 버튼이 감춰진다.
 */
export function HeaderBar({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setTarget(document.getElementById(HEADER_BAR_ID))
    // Next는 떠난 화면을 숨긴 채 남겨 두므로(Activity) 숨겨질 때 바를 비운다. effect 정리는 숨겨질 때도 돈다.
    return () => setTarget(null)
  }, [])
  return target ? createPortal(children, target) : null
}

/** 모바일에서 화면의 헤더 바가 보이는 동안 로고 · 버튼을 감춘다. */
const BAR_HIDES =
  "motion-safe:transition-opacity motion-safe:duration-300 max-lg:group-has-[[data-header-bar]]/header:pointer-events-none max-lg:group-has-[[data-header-bar]]/header:opacity-0"

/** 화면 맨 위에서 헤더 아래까지의 높이(px). 헤더가 숨으면 0이 된다. 고정 줄(탭 · 구간 줄)이 CSS 변수 --shell-top으로 읽는다. */
const HEADER_HEIGHT = 56

/**
 * hide-on-scroll 화면에서 헤더를 보일지(.scratch/shell-unify/spec.md 4-2). 아래로 내리면 숨고 위로 올리면 나온다.
 * 판정은 headerScrollStep(순수 함수)이 한다. 데스크톱(≥1024)과 pinned 화면은 늘 보인다.
 * 보임 여부를 <html>의 --shell-top으로도 내보내 고정 줄이 헤더 아래 · 맨 위로 따라 움직이게 한다.
 */
function useHeaderVisible(hideOnScroll: boolean) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (!hideOnScroll) {
      setVisible(true)
      return
    }
    const desktop = window.matchMedia("(min-width: 1024px)")
    let state = { ...INITIAL_HEADER_SCROLL, lastY: window.scrollY, anchorY: window.scrollY }
    let frame = 0
    const update = () => {
      frame = 0
      if (desktop.matches) return setVisible(true)
      state = headerScrollStep(state, window.scrollY, document.documentElement.scrollHeight - window.innerHeight)
      setVisible(state.visible)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    // 숨은 채로 데스크톱 폭이 되면(태블릿 회전 등) 스크롤을 기다리지 않고 바로 보인다.
    desktop.addEventListener("change", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      desktop.removeEventListener("change", onScroll)
      cancelAnimationFrame(frame)
      setVisible(true)
    }
  }, [hideOnScroll])
  useEffect(() => {
    document.documentElement.style.setProperty("--shell-top", `${visible ? HEADER_HEIGHT : 0}px`)
  }, [visible])
  return [visible, () => setVisible(true)] as const
}

/** 이만큼(px) 내려가면 헤더가 위에서 떨어져 떠 있는 바가 된다. */
const STUCK_AT = 8

/** 페이지가 맨 위에서 STUCK_AT보다 내려갔는지. */
function useScrolledDown() {
  const [down, setDown] = useState(false)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setDown(window.scrollY > STUCK_AT)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])
  return down
}

/**
 * 사이트 헤더: 로고 · (데스크톱) 주요 메뉴 · 화면별 버튼(actions). 위에 붙어 있고, hide-on-scroll 화면(screens.ts)에서는 모바일에서 아래로 내리면 숨는다.
 * 맨 위에서는 화면 폭에 붙은 평평한 줄이고, 내려가면 가장자리에서 떨어진 둥근 바로 떠오른다.
 * 다시 맨 위에 닿으면 탄성 있게 제자리로 붙는다(자석처럼).
 * 모바일 헤더 타입: 화면이 HeaderBar로 넣는 바(예: 품종 상세의 "‹ 계란 · 담기")가 data-header-bar를 달면
 * 로고 · 버튼 자리를 그 바가 차지한다. 데스크톱(≥1024)은 바 자리를 그리지 않는다.
 */
export function SiteHeader({
  badges = {},
  actions,
}: {
  badges?: MenuBadges
  actions?: React.ReactNode
}) {
  const stuck = useScrolledDown()
  // 검색 타입 화면(P2)은 모바일에서 화면의 검색 입력이 헤더 자리를 맡는다(.scratch/shell-unify/spec.md 3장).
  const { header, scroll } = screenOf(usePathname())
  const [visible, reveal] = useHeaderVisible(scroll === "hide-on-scroll")
  return (
    <header
      data-stuck={stuck ? "" : undefined}
      data-hidden={visible ? undefined : ""}
      // 숨은 헤더 안으로 키보드 초점이 들어오면 다시 보인다.
      onFocusCapture={reveal}
      className={cn(
        "group/header sticky top-0 z-(--z-dock) h-14 motion-safe:transition-transform motion-safe:duration-300 max-lg:data-hidden:-translate-y-[72px]",
        header === "search" && "max-lg:hidden"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-14 border border-transparent",
          "motion-safe:transition-[top,left,right,height,border-radius,background-color,border-color,box-shadow] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(.34,1.45,.64,1)]",
          "group-data-stuck/header:top-2 group-data-stuck/header:right-[max(10px,calc(50%-548px))] group-data-stuck/header:left-[max(10px,calc(50%-548px))] group-data-stuck/header:h-12",
          "group-data-stuck/header:rounded-[20px] group-data-stuck/header:border-silver/50 group-data-stuck/header:bg-canvas/90 group-data-stuck/header:shadow-lg group-data-stuck/header:shadow-ink/8 group-data-stuck/header:backdrop-blur-md"
        )}
      >
        <div className="relative mx-auto flex h-full max-w-[1080px] items-center gap-2 px-[18px] motion-safe:transition-[padding] motion-safe:duration-500 group-data-stuck/header:px-2.5 lg:gap-8 lg:px-6 lg:group-data-stuck/header:px-4">
          <Link
            href={routes.home}
            aria-label={`${SITE_CONFIG.name} 홈`}
            className={cn(
              "inline-flex shrink-0 items-center rounded-sm no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
              BAR_HIDES
            )}
          >
            <span className="inline-flex origin-left motion-safe:transition-transform motion-safe:duration-500 group-data-stuck/header:scale-[.85]">
              <BrandLogo />
            </span>
          </Link>
          <nav aria-label="주요 메뉴" className="hidden gap-6 lg:flex">
            {MENUS.map(({ key, label, href, also, exact }) => (
              <NavLink
                key={key}
                href={href}
                also={also}
                exact={exact}
                className="inline-flex items-center gap-1.5 text-[15px] text-stone hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink"
              >
                {label}
                {badges[key]}
              </NavLink>
            ))}
          </nav>
          <div className={cn("ml-auto flex items-center gap-1 lg:gap-2", BAR_HIDES)}>{actions}</div>
          {/* 모바일 헤더 바 자리(HeaderBar가 포털로 채운다). 비어 있을 때 로고 클릭을 막지 않게 보이는 바만 클릭을 받는다. */}
          <div
            id={HEADER_BAR_ID}
            className="pointer-events-none absolute inset-y-0 right-[18px] left-[18px] motion-safe:transition-[left,right] motion-safe:duration-500 group-data-stuck/header:right-2.5 group-data-stuck/header:left-2.5 lg:hidden"
          />
        </div>
      </div>
    </header>
  )
}
