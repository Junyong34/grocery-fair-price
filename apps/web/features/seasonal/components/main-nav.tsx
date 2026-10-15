"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  CalendarDays,
  Leaf,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import { BrandLogo } from "@/shared/brand-logo"
import { routes } from "@/shared/routes"

import { matchesPath, NavLink } from "./nav-link"

// 주요 메뉴 3개. 모바일은 하단 떠 있는 내비, 데스크톱(≥1024)은 헤더 안에 보인다(명세 2.2, spec "내비").
// 활성 매핑: 월별 보기 → 이달, 명절 → 계절.
const ITEMS: readonly {
  label: string
  href: string
  also?: readonly string[]
  exact?: boolean
  Icon: LucideIcon
}[] = [
  {
    label: "이달",
    href: routes.seasonal.root,
    also: [routes.seasonal.months],
    exact: true,
    Icon: CalendarDays,
  },
  {
    label: "계절",
    href: routes.seasonal.seasons,
    also: [routes.seasonal.festivals],
    Icon: Leaf,
  },
  { label: "나의 식탁", href: routes.seasonal.myTable, Icon: UtensilsCrossed },
]

/** 하단 내비 칸 하나의 폭(px). 강조 배경이 칸 단위로 미끄러진다. */
const CELL = 76

/**
 * 모바일 하단 가운데 떠 있는 내비(cojeev Action Dock 모양을 따랐다).
 * 베이지 트레이에 아이콘·라벨을 세로로 놓고, 지금 메뉴 뒤에 둥근 강조 배경이 깔린다. 메뉴를 바꾸면 배경이 옆 칸으로 미끄러진다.
 */
export function FloatingNav() {
  const pathname = usePathname()
  const active = ITEMS.findIndex(({ href, also, exact }) =>
    matchesPath(pathname, href, { also, exact })
  )
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-(--z-dock) mx-auto w-fit rounded-[28px] border border-silver/60 bg-hairline/92 p-1.5 shadow-lg shadow-ink/10 backdrop-blur-md lg:hidden"
    >
      <div className="relative flex">
        {active >= 0 && (
          <span
            aria-hidden
            className="absolute inset-y-0 rounded-[22px] bg-gold-soft motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.34,1.3,.64,1)]"
            style={{ width: CELL, transform: `translateX(${active * CELL}px)` }}
          />
        )}
        {ITEMS.map(({ label, href, Icon }, i) => (
          <Link
            key={href}
            href={href}
            aria-current={i === active ? "page" : undefined}
            className={cn(
              "relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] leading-none no-underline transition-colors duration-200",
              i === active
                ? "font-semibold text-espresso hover:text-espresso"
                : "text-stone hover:text-ink"
            )}
            style={{ width: CELL }}
          >
            <Icon
              aria-hidden
              size={22}
              strokeWidth={i === active ? 1.9 : 1.6}
            />
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
 * 제철 영역 헤더: 로고 · (데스크톱) 주요 메뉴 · 검색 · 설정. 늘 위에 붙어 있다.
 * 맨 위에서는 화면 폭에 붙은 평평한 줄이고, 내려가면 가장자리에서 떨어진 둥근 바로 떠오른다.
 * 다시 맨 위에 닿으면 탄성 있게 제자리로 붙는다(자석처럼). context는 떠 있을 때만 로고 옆에 보인다.
 */
export function SeasonalHeader({
  actions,
  context,
}: {
  actions?: React.ReactNode
  context?: React.ReactNode
}) {
  const stuck = useScrolledDown()
  return (
    <header
      data-stuck={stuck ? "" : undefined}
      className="group/header sticky top-0 z-(--z-dock) h-14"
    >
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
            href={routes.seasonal.root}
            aria-label="제철달력 홈"
            className="inline-flex shrink-0 items-center rounded-sm no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span className="inline-flex origin-left motion-safe:transition-transform motion-safe:duration-500 group-data-stuck/header:scale-[.85]">
              <BrandLogo />
            </span>
          </Link>
          {context && (
            <div className="min-w-0 translate-y-1 opacity-0 motion-safe:transition-[opacity,translate] motion-safe:duration-300 group-data-stuck/header:translate-y-0 group-data-stuck/header:opacity-100">
              {context}
            </div>
          )}
          <nav aria-label="주요 메뉴" className="hidden gap-6 lg:flex">
            {ITEMS.map(({ label, href, also, exact }) => (
              <NavLink
                key={href}
                href={href}
                also={also}
                exact={exact}
                className="text-[15px] text-stone hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink"
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 lg:gap-2">
            {actions}
          </div>
        </div>
      </div>
    </header>
  )
}
