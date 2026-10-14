"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

// 주요 메뉴 3개. 모바일은 하단 떠 있는 내비, 데스크톱(≥1024)은 상단 바로 보인다(명세 2.2, spec "내비").
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

/** 데스크톱 상단 바. actions에 검색 입력과 ⚙가 들어온다. */
export function TopNav({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-(--z-sticky) hidden border-b border-hairline bg-canvas/94 backdrop-blur lg:block">
      <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-8 px-6">
        <Link
          href={routes.seasonal.root}
          aria-label="제철달력 홈"
          className="inline-flex shrink-0 items-center rounded-sm no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <BrandLogo />
        </Link>
        <nav aria-label="주요 메뉴" className="flex gap-6">
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
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </header>
  )
}
