"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { BrandLogo } from "@/shared/brand-logo"
import { SITE_CONFIG } from "@/shared/meta"
import { routes } from "@/shared/routes"

import { MENUS, type MenuArea } from "./menus"
import { matchesPath, NavLink } from "./nav-link"

/** 메뉴 칸 옆에 붙는 배지(담은 개수 등). 메뉴 key → 요소. 레이아웃이 넣는다. */
export type MenuBadges = Partial<Record<string, React.ReactNode>>

/** 하단 내비 칸 하나의 폭(px). 강조 배경이 칸 단위로 미끄러진다. 칸이 4개여도 375px에 들어간다(288px). */
const CELL = 72

/**
 * 모바일 하단 가운데 떠 있는 내비(cojeev Action Dock 모양을 따랐다).
 * 2차 탭과 같은 크림(gold-wash) 트레이에 아이콘·라벨을 세로로 놓고, 지금 메뉴 뒤에 둥근 강조 배경이 깔린다. 메뉴를 바꾸면 배경이 옆 칸으로 미끄러진다.
 */
export function FloatingNav({ area, badges = {} }: { area: MenuArea; badges?: MenuBadges }) {
  const pathname = usePathname()
  const items = MENUS[area]
  const active = items.findIndex(({ href, also, exact }) => matchesPath(pathname, href, { also, exact }))
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
 * 사이트 헤더: 로고 · (데스크톱) 주요 메뉴 · 화면별 버튼(actions). 늘 위에 붙어 있다.
 * 맨 위에서는 화면 폭에 붙은 평평한 줄이고, 내려가면 가장자리에서 떨어진 둥근 바로 떠오른다.
 * 다시 맨 위에 닿으면 탄성 있게 제자리로 붙는다(자석처럼).
 * tabs(2차 탭)는 떠 있을 때만 보인다. 본문 위 2차 탭이 스크롤로 가려져도 헤더에서 바로 옮길 수 있다.
 */
export function SiteHeader({
  area,
  badges = {},
  actions,
  tabs,
}: {
  area: MenuArea
  badges?: MenuBadges
  actions?: React.ReactNode
  tabs?: React.ReactNode
}) {
  const stuck = useScrolledDown()
  return (
    <header data-stuck={stuck ? "" : undefined} className="group/header sticky top-0 z-(--z-dock) h-14">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-14 border border-transparent",
          "motion-safe:transition-[top,left,right,height,border-radius,background-color,border-color,box-shadow] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(.34,1.45,.64,1)]",
          "group-data-stuck/header:top-2 group-data-stuck/header:right-[max(10px,calc(50%-548px))] group-data-stuck/header:left-[max(10px,calc(50%-548px))] group-data-stuck/header:h-12",
          "group-data-stuck/header:rounded-[20px] group-data-stuck/header:border-silver/50 group-data-stuck/header:bg-canvas/90 group-data-stuck/header:shadow-lg group-data-stuck/header:shadow-ink/8 group-data-stuck/header:backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-full max-w-[1080px] items-center gap-2 px-[18px] motion-safe:transition-[padding] motion-safe:duration-500 group-data-stuck/header:px-2.5 lg:gap-8 lg:px-6 lg:group-data-stuck/header:px-4">
          <Link
            href={routes.home}
            aria-label={`${SITE_CONFIG.name} 홈`}
            className="inline-flex shrink-0 items-center rounded-sm no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span className="inline-flex origin-left motion-safe:transition-transform motion-safe:duration-500 group-data-stuck/header:scale-[.85]">
              <BrandLogo />
            </span>
          </Link>
          <nav aria-label="주요 메뉴" className="hidden gap-6 lg:flex">
            {MENUS[area].map(({ key, label, href, also, exact }) => (
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
          {tabs && (
            // 맨 위에서는 본문 위 2차 탭이 보이므로 숨기고(inert로 초점도 막는다) 떠 있을 때만 나타난다.
            <div
              inert={!stuck}
              className="min-w-0 translate-y-1 opacity-0 empty:hidden motion-safe:transition-[opacity,translate] motion-safe:duration-300 group-data-stuck/header:translate-y-0 group-data-stuck/header:opacity-100 lg:border-l lg:border-hairline lg:pl-6"
            >
              {tabs}
            </div>
          )}
          <div className="ml-auto flex items-center gap-1 lg:gap-2">{actions}</div>
        </div>
      </div>
    </header>
  )
}
