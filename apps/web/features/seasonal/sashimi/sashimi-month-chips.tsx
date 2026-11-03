"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { MONTHS } from "@workspace/seasonal/data/months"
import { ScrollRow } from "@workspace/ui/components/scroll-row"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

/**
 * 제철 회 달 칩 12개(.scratch/sashimi/spec.md 3장). 레이아웃에 있어 달을 바꿔도 가로 스크롤 위치가 남는다.
 * 모바일은 가로 스크롤, 데스크톱(lg)은 12칸 격자로 한 줄에 모두 보인다. 칩은 그 달 주소로 가는 링크다. 고른 달이 줄 가운데 근처에 오게 옮긴다.
 */
export function SashimiMonthChips() {
  const pathname = usePathname()
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = scroller.current
    const chip = box?.querySelector<HTMLElement>("[aria-current=page]")
    if (!box || !chip) return
    box.scrollTo({
      left: chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    })
  }, [pathname])

  return (
    <nav aria-label="달 고르기" className="mx-auto max-w-[720px]">
      <ScrollRow
        ref={scroller}
        className="gap-1.5 px-[18px] py-2 lg:grid lg:grid-cols-12 lg:px-6"
        previousLabel="이전 달 보기"
        nextLabel="다음 달 보기"
      >
        {MONTHS.map((month) => {
          const href = routes.seasonal.sashimiMonth(month)
          const current = pathname === href
          return (
            <Link
              key={month}
              href={href}
              scroll={false}
              aria-current={current ? "page" : undefined}
              className={cn(
                "relative inline-flex h-9 shrink-0 items-center justify-center rounded-full border px-3.5 text-sm whitespace-nowrap tabular-nums no-underline transition-colors after:absolute after:inset-x-0 after:-inset-y-1 lg:px-0",
                current
                  ? "border-gold bg-gold-soft font-semibold text-espresso"
                  : "border-hairline bg-surface/70 text-stone hover:border-silver hover:text-ink"
              )}
            >
              {month}월
            </Link>
          )
        })}
      </ScrollRow>
    </nav>
  )
}
