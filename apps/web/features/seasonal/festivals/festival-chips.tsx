"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useRef } from "react"

import { FESTIVALS } from "@workspace/seasonal/data/festivals"
import { cn } from "@workspace/ui/lib/utils"
import { ScrollRow } from "@workspace/ui/components/scroll-row"

import { routes } from "@/shared/routes"

/** 1g 명절 칩(명세 3.4). 레이아웃에 있어 명절을 바꿔도 가로 스크롤 위치가 남는다. 고른 명절은 주소에서 읽는다. */
export function FestivalChips() {
  const selected = useParams<{ festival: string }>().festival
  const scroller = useRef<HTMLDivElement>(null)

  // 고른 칩이 가운데 근처에 오게 한다.
  useEffect(() => {
    const box = scroller.current
    const chip = box?.querySelector<HTMLElement>("[aria-current=page]")
    if (!box || !chip) return
    box.scrollTo({
      left: chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    })
  }, [selected])

  return (
    <nav aria-label="명절 고르기" className="mx-auto max-w-[720px]">
      <ScrollRow
        ref={scroller}
        className="gap-1.5 px-[18px] py-3 lg:flex-wrap lg:justify-center"
        previousLabel="이전 명절 보기"
        nextLabel="다음 명절 보기"
      >
        {FESTIVALS.map((festival) => (
          <Link
            key={festival.slug}
            href={routes.seasonal.festival(festival.slug)}
            scroll={false}
            aria-current={festival.slug === selected ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border border-hairline px-3.5 py-1.5 text-sm text-stone no-underline hover:text-ink",
              "aria-[current=page]:border-gold aria-[current=page]:bg-gold-wash aria-[current=page]:text-gold-deep"
            )}
          >
            {festival.name}
          </Link>
        ))}
      </ScrollRow>
    </nav>
  )
}
