"use client"

import Link from "next/link"
import { CalendarDays, Leaf, UtensilsCrossed, type LucideIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { NavLink, useIsActive } from "./nav-link"

// 주요 메뉴 3개. 모바일은 하단 Floating Nav, 데스크톱(≥1024)은 상단 바로 보인다(명세 2.2, spec "내비").
// 활성 매핑: 월별 보기 → 이달, 명절 → 계절.
const ITEMS: readonly { label: string; href: string; also?: readonly string[]; exact?: boolean; Icon: LucideIcon }[] = [
  { label: "이달", href: routes.seasonal.root, also: [routes.seasonal.months], exact: true, Icon: CalendarDays },
  { label: "계절", href: routes.seasonal.seasons, also: [routes.seasonal.festivals], Icon: Leaf },
  { label: "나의 식탁", href: routes.seasonal.myTable, Icon: UtensilsCrossed },
]

/** 모바일 하단 가운데 알약 모양 내비. 활성 항목은 아이콘과 라벨, 나머지는 아이콘만 보인다. */
export function FloatingNav() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-(--z-dock) mx-auto flex w-fit max-w-[300px] items-center gap-1 rounded-full bg-ink-band-soft p-1.5 shadow-lg lg:hidden"
    >
      {ITEMS.map((item) => (
        <FloatingNavItem key={item.href} {...item} />
      ))}
    </nav>
  )
}

function FloatingNavItem({ label, href, also, exact, Icon }: (typeof ITEMS)[number]) {
  const active = useIsActive(href, { also, exact })
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center justify-center gap-1.5 rounded-full text-[13px] no-underline transition-colors duration-200",
        active
          ? "bg-canvas/16 px-4 text-canvas hover:text-canvas"
          : "w-11 text-mute hover:text-canvas",
      )}
    >
      <Icon aria-hidden size={20} strokeWidth={1.6} />
      <span className={cn(!active && "sr-only")}>{label}</span>
    </Link>
  )
}

/** 데스크톱 상단 바. actions에 검색 입력과 ⚙가 들어온다. */
export function TopNav({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-(--z-sticky) hidden border-b border-hairline bg-canvas/94 backdrop-blur lg:block">
      <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-8 px-6">
        <Link href={routes.seasonal.root} className="font-heading text-xl font-bold text-ink no-underline">
          제철달력
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
