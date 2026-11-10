"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"
import { routes } from "@/shared/routes"

const TABS = [
  {
    label: "재료 궁합표",
    href: routes.babyFood.pairings,
    matches: (path: string) =>
      path === routes.babyFood.root ||
      path.startsWith(routes.babyFood.pairings) ||
      path.startsWith("/baby-food/result"),
  },
  {
    label: "월령별 과일 도감",
    href: routes.babyFood.fruits,
    matches: (path: string) => path.startsWith(routes.babyFood.fruits),
  },
] as const

export function BabyFoodTabs() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-hairline bg-canvas" aria-label="이유식 메뉴">
      <div className="mx-auto flex max-w-[1080px] items-stretch gap-5 px-[18px] max-[360px]:px-3 lg:px-6">
        {TABS.map((tab) => {
          const active = tab.matches(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                // 위 제철달력 탭(알약)과 아래 거르기 알약과 겹치지 않게, 이 줄은 밑줄 탭으로 둔다.
                "-mb-px inline-flex min-h-11 items-center border-b-2 text-[15px] no-underline transition-colors",
                active
                  ? "border-ink font-semibold text-ink"
                  : "border-transparent font-medium text-caption hover:text-ink"
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
