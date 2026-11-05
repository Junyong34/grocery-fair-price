"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { MONTHS } from "@workspace/seasonal/data/months"
import { ScrollRow } from "@workspace/ui/components/scroll-row"

import { routes } from "@/shared/routes"

import { PillLink } from "../components/pill"
import { SASHIMI_MONTHS_ID } from "./sashimi-chip-row"

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
    <nav id={SASHIMI_MONTHS_ID} aria-label="달 고르기" className="mx-auto max-w-[720px]">
      <ScrollRow
        ref={scroller}
        className="gap-1.5 px-[18px] pt-2 pb-3 lg:grid lg:grid-cols-12 lg:px-6"
        previousLabel="이전 달 보기"
        nextLabel="다음 달 보기"
      >
        {MONTHS.map((month) => {
          const href = routes.seasonal.sashimiMonth(month)
          const current = pathname === href
          return (
            <PillLink
              key={month}
              href={href}
              scroll={false}
              current={current}
              className="lg:px-0"
            >
              {month}월
            </PillLink>
          )
        })}
      </ScrollRow>
    </nav>
  )
}
