"use client"

import { Children, Suspense, useEffect, useRef, useState } from "react"

import { seasonOfMonth, SEASONS } from "@workspace/seasonal/data/seasons"
import { cn } from "@workspace/ui/lib/utils"

import { useToday } from "@/shared/today-context"

/**
 * 3a 계절 카드 줄(명세 3.3). 모바일은 한 장씩 넘기는 캐러셀(scroll-snap)과 점 4개, 데스크톱은 4장 한 줄.
 * 카드(children)는 서버에서 그리고, 여기서는 넘기기·점·첫 위치(지금 계절)만 맡는다.
 */
export function SeasonCarousel({ children }: { children: React.ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const count = Children.count(children)

  const slides = () => [...(scroller.current?.children ?? [])] as HTMLElement[]
  const goTo = (i: number) => {
    const slide = slides()[i]
    const box = scroller.current
    if (!slide || !box) return
    box.scrollTo({
      left: slide.offsetLeft - (box.clientWidth - slide.offsetWidth) / 2,
      behavior: "instant",
    })
    setIndex(i)
  }

  // 스크롤이 멈추면 가운데에 가장 가까운 카드를 현재 장으로 본다.
  useEffect(() => {
    const box = scroller.current
    if (!box) return
    let timer: ReturnType<typeof setTimeout>
    const settle = () => {
      const center = box.scrollLeft + box.clientWidth / 2
      const nearest = slides().reduce(
        (best, slide, i) => {
          const distance = Math.abs(
            slide.offsetLeft + slide.offsetWidth / 2 - center
          )
          return distance < best.distance ? { i, distance } : best
        },
        { i: 0, distance: Infinity }
      )
      setIndex(nearest.i)
    }
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(settle, 80)
    }
    box.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      box.removeEventListener("scroll", onScroll)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={scroller}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto px-[18px] [scrollbar-width:none]",
          "lg:snap-none lg:overflow-visible lg:px-0"
        )}
      >
        {children}
      </div>
      <Suspense>
        <StartAtCurrentSeason goTo={goTo} />
      </Suspense>
      <div className="flex items-center justify-center gap-3 lg:hidden">
        <div className="flex gap-1.5" role="group" aria-label="계절 고르기">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번째 계절`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full bg-silver transition-[width] duration-200",
                i === index ? "w-[18px] bg-ink" : "w-1.5"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-stone">
          옆으로 밀어 계절 넘기기 · {index + 1} / {count}
        </span>
      </div>
    </div>
  )
}

/** 처음 그릴 때 한 번, 지금 계절 카드에서 시작한다. 다른 화면에 갔다 돌아오면(라우트 보존) 보던 위치를 그대로 둔다. */
function StartAtCurrentSeason({ goTo }: { goTo: (i: number) => void }) {
  const { month } = useToday()
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    goTo(SEASONS.indexOf(seasonOfMonth(month)))
  }, [goTo, month])
  return null
}
