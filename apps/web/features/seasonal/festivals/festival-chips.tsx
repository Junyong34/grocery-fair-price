"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useRef } from "react"

import { findDish } from "@workspace/seasonal/data/dishes"
import { FESTIVALS } from "@workspace/seasonal/data/festivals"
import { ScrollRow } from "@workspace/ui/components/scroll-row"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { DishImage } from "./dish-image"
import { FestivalBackground } from "./festival-background"
import { FESTIVAL_STYLE } from "./festival-style"

/**
 * 1g 명절 선택 카드 바(명세 3.4).
 * 레이아웃에 있어 명절을 바꿔도 가로 스크롤 위치가 남는다.
 * 모바일·태블릿은 가로 스크롤 미니 카드, 데스크톱(lg)은 5열 카드 그리드로 한눈에 보여준다.
 */
export function FestivalChips() {
  const selected = useParams<{ festival: string }>().festival
  const scroller = useRef<HTMLDivElement>(null)

  // 고른 명절 카드가 가운데 근처에 오게 한다.
  useEffect(() => {
    const box = scroller.current
    const card = box?.querySelector<HTMLElement>("[aria-current=page]")
    if (!box || !card) return
    box.scrollTo({
      left: card.offsetLeft - (box.clientWidth - card.offsetWidth) / 2,
      behavior: "smooth",
    })
  }, [selected])

  return (
    <nav aria-label="명절 고르기" className="mx-auto max-w-[840px]">
      <ScrollRow
        ref={scroller}
        className="gap-2 px-[18px] py-3 lg:grid lg:grid-cols-5 lg:gap-2.5 lg:px-6"
        previousLabel="이전 명절 보기"
        nextLabel="다음 명절 보기"
      >
        {FESTIVALS.map((festival) => {
          const isSelected = festival.slug === selected
          const style = FESTIVAL_STYLE[festival.slug]
          const leadDish = findDish(festival.traditionalDishes[0])

          return (
            <Link
              key={festival.slug}
              href={routes.seasonal.festival(festival.slug)}
              scroll={false}
              aria-current={isSelected ? "page" : undefined}
              style={{ "--festival-color": style.color } as React.CSSProperties}
              className={cn(
                "group relative isolate flex w-[138px] shrink-0 flex-col justify-between overflow-hidden rounded-xl border px-3 pt-3 pb-2.5 text-ink no-underline transition-all duration-200 hover:text-ink lg:w-auto",
                isSelected
                  ? "border-[color:var(--festival-color)] bg-surface shadow-xs ring-1 ring-[color:var(--festival-color)]/35"
                  : "border-hairline bg-surface/65 hover:border-silver hover:bg-surface/90"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 top-0 transition-all",
                  isSelected ? "h-[3.5px] opacity-100" : "h-[2.5px] opacity-65 group-hover:opacity-100"
                )}
                style={{ background: style.color }}
              />
              <FestivalBackground slug={festival.slug} compact active={isSelected} />

              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium tracking-tight text-stone">
                  {style.shortPeriod}
                </span>
                <span className="font-heading text-[18px] leading-snug font-bold tracking-tight">
                  {festival.name}
                </span>
              </div>

              <div className="mt-2.5 flex items-end justify-between gap-1.5">
                <span
                  className={cn(
                    "text-[11px] leading-none",
                    isSelected ? "font-semibold text-ink" : "text-caption"
                  )}
                >
                  절식 {festival.traditionalDishes.length} · 제철 {festival.seasonalFoodIds.length}
                </span>
                {leadDish && (
                  <span className="block size-8 shrink-0 drop-shadow-xs transition-transform duration-200 group-hover:scale-105">
                    <DishImage dish={leadDish} sizes="36px" preload={isSelected} />
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </ScrollRow>
    </nav>
  )
}
