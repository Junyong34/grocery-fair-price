"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"
import { routes } from "@/shared/routes"

const TABS = [
  {
    label: "이유식 궁합",
    href: routes.babyFood.pairings,
    matches: (path: string) =>
      path === routes.babyFood.root ||
      path.startsWith(routes.babyFood.pairings) ||
      path.startsWith("/baby-food/result"),
  },
  {
    label: "월령별 과일시기 도감",
    href: routes.babyFood.fruits,
    matches: (path: string) => path.startsWith(routes.babyFood.fruits),
  },
] as const

export function BabyFoodTabs() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-hairline bg-canvas" aria-label="이유식 메뉴">
      <div className="mx-auto flex max-w-[1080px] items-center gap-2 px-[18px] py-2.5 max-[360px]:px-3 lg:px-6">
        {TABS.map((tab) => {
          const active = tab.matches(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-ink font-semibold text-canvas"
                  : "text-stone hover:bg-hairline/60 hover:text-ink"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
