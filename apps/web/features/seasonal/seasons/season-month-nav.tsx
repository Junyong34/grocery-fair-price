"use client"

import { useEffect, useRef, useState } from "react"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { SEASON_MONTHS, type Season } from "@workspace/seasonal/data/seasons"

/** 고정 바 바로 아래의 읽기 위치를 기준으로 현재 달을 표시한다. 겨울도 12·1·2월 순서를 따른다. */
export function SeasonMonthNav({ season }: { season: Season }) {
  const months = SEASON_MONTHS[season]
  const [activeMonth, setActiveMonth] = useState(months[0])
  const navRef = useRef<HTMLElement>(null)

  useEffect(
    function trackMonthOnScroll() {
      let frame = 0
      const sections = months.map((month) => ({
        month,
        element: document.getElementById(`season-month-${month}`),
      }))
      const update = () => {
        frame = 0
        const nav = navRef.current
        if (!nav) return
        const bottom = nav.getBoundingClientRect().bottom
        // 헤더가 숨거나 다시 나타나도, 고정 바에 가리지 않는 본문 위쪽을 읽기 위치로 잡는다.
        const readingLine =
          bottom + Math.min(120, (window.innerHeight - bottom) / 4)
        let current = months[0]
        for (const { month, element } of sections) {
          if (element && element.getBoundingClientRect().top <= readingLine)
            current = month
        }
        setActiveMonth(current)
      }
      const scheduleUpdate = () => {
        if (!frame) frame = requestAnimationFrame(update)
      }
      const observer = new ResizeObserver(scheduleUpdate)
      for (const { element } of sections) if (element) observer.observe(element)
      scheduleUpdate()
      window.addEventListener("scroll", scheduleUpdate, { passive: true })
      window.addEventListener("resize", scheduleUpdate)
      return function stopTrackingMonth() {
        cancelAnimationFrame(frame)
        observer.disconnect()
        window.removeEventListener("scroll", scheduleUpdate)
        window.removeEventListener("resize", scheduleUpdate)
      }
    },
    [months]
  )

  return (
    <nav
      ref={navRef}
      aria-label={`${SEASON_COPY[season].name} 월별 제철로 이동`}
      className="ml-auto flex items-center gap-1"
    >
      {months.map((month) => (
        <a
          key={month}
          href={`#season-month-${month}`}
          aria-current={activeMonth === month ? "location" : undefined}
          className="group/month inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[13px] text-stone no-underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          <span className="inline-flex h-8 min-w-11 items-center justify-center rounded-full border border-hairline bg-canvas px-2 group-hover/month:bg-surface/60 group-aria-[current=location]/month:border-gold-soft group-aria-[current=location]/month:bg-gold-soft/30 group-aria-[current=location]/month:font-semibold group-aria-[current=location]/month:text-gold-deep">
            {month}월
          </span>
        </a>
      ))}
    </nav>
  )
}
