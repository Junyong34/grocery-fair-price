"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Suspense, useEffect, useRef } from "react"

import { foodsInMonth } from "@workspace/seasonal/data/foods"
import { MONTHS } from "@workspace/seasonal/data/months"
import { seasonOfMonth, type Season } from "@workspace/seasonal/data/seasons"
import { cn } from "@workspace/ui/lib/utils"

import { useEatenIds } from "@/shared/eaten-store"
import { routes } from "@/shared/routes"
import { useToday } from "@/shared/today-context"

const SEASON_BG: Record<Season, string> = {
  spring: "bg-season-spring",
  summer: "bg-season-summer",
  autumn: "bg-season-autumn",
  winter: "bg-season-winter",
}

/** 데스크톱 계절 띠(명세 3.2). 겨울은 1–2월과 12월 두 칸으로 나뉜다. */
const SEASON_BAND: readonly { season: Season; label: string; span: number }[] =
  [
    { season: "winter", label: "겨울", span: 2 },
    { season: "spring", label: "봄", span: 3 },
    { season: "summer", label: "여름", span: 3 },
    { season: "autumn", label: "가을", span: 3 },
    { season: "winter", label: "겨울", span: 1 },
  ]

/**
 * 2b 12개월 타임라인 = 달 이동 내비. 모바일은 가로 스크롤 칩, 데스크톱은 12열.
 * 레이아웃에 있어 달을 바꿔도 다시 마운트되지 않는다. 선택한 달은 주소에서 읽는다.
 */
export function MonthTimeline() {
  const selected = Number(useParams<{ month: string }>().month)
  return (
    <nav aria-label="달 고르기" className="mx-auto max-w-[1080px] lg:px-6">
      <MobileChips selected={selected} />
      <DesktopColumns selected={selected} />
    </nav>
  )
}

function MobileChips({ selected }: { selected: number }) {
  const scroller = useRef<HTMLDivElement>(null)

  // 선택한 칩이 가운데 근처에 오게 한다(명세 3.2 ①).
  useEffect(() => {
    const chip = scroller.current?.querySelector<HTMLElement>(
      "[aria-current=page]"
    )
    if (!chip || !scroller.current) return
    const { clientWidth } = scroller.current
    scroller.current.scrollTo({
      left: chip.offsetLeft - (clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    })
  }, [selected])

  return (
    <div
      ref={scroller}
      className="flex gap-1.5 overflow-x-auto px-[18px] py-3 [scrollbar-width:none] lg:hidden"
    >
      {MONTHS.map((month) => (
        <Link
          key={month}
          href={routes.seasonal.month(month)}
          scroll={false}
          aria-current={month === selected ? "page" : undefined}
          className={cn(
            "flex w-[60px] shrink-0 flex-col items-start gap-1 rounded-md border border-hairline px-2 py-2 text-ink no-underline hover:text-ink",
            "aria-[current=page]:border-gold aria-[current=page]:bg-gold-wash"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "h-1 w-7 rounded-full",
              SEASON_BG[seasonOfMonth(month)]
            )}
          />
          <span className="text-[15px] font-semibold tabular-nums">
            {month}월
          </span>
          <span className="text-[11px] text-stone">
            {foodsInMonth(month).length}가지
          </span>
          <Suspense fallback={<span className="h-3.5" />}>
            <TodayMark month={month} className="text-[10px]" />
          </Suspense>
        </Link>
      ))}
    </div>
  )
}

function DesktopColumns({ selected }: { selected: number }) {
  return (
    <div className="hidden lg:block">
      <div
        aria-hidden
        className="grid grid-cols-12 gap-px pt-4 text-[11px] text-stone"
      >
        {SEASON_BAND.map(({ season, label, span }, i) => (
          <span
            key={i}
            style={{ gridColumn: `span ${span}` }}
            className="relative px-2 pt-1.5"
          >
            <span
              className={cn(
                "absolute inset-x-0 top-0 h-[3px]",
                SEASON_BG[season]
              )}
            />
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-px border-b border-hairline">
        {MONTHS.map((month) => {
          const foods = foodsInMonth(month)
          return (
            <Link
              key={month}
              href={routes.seasonal.month(month)}
              scroll={false}
              aria-current={month === selected ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col gap-1 px-2 pt-2 pb-3 text-ink no-underline hover:bg-surface/60 hover:text-ink",
                "aria-[current=page]:bg-gold-wash aria-[current=page]:shadow-[inset_0_-3px_0_var(--color-gold)]"
              )}
            >
              <span className="font-number text-[30px] leading-none tabular-nums">
                {month}
              </span>
              <span className="truncate text-[11px] text-stone">
                {foods.length}가지 ·{" "}
                {foods
                  .slice(0, 2)
                  .map((food) => food.name)
                  .join(", ")}
              </span>
              <Suspense
                fallback={
                  <FoodBars
                    ids={foods.map((food) => food.id)}
                    eaten={new Set()}
                  />
                }
              >
                <EatenFoodBars ids={foods.map((food) => food.id)} />
              </Suspense>
              <Suspense fallback={<span className="h-3.5" />}>
                <TodayMark
                  month={month}
                  className="text-[11px] text-gold-deep"
                  dot
                />
              </Suspense>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** 오늘이 든 달이면 "오늘". 오늘은 요청 시점 값이라 Suspense 안에서 읽는다. */
function TodayMark({
  month,
  className,
  dot = false,
}: {
  month: number
  className?: string
  dot?: boolean
}) {
  const today = useToday()
  if (today.month !== month) return <span className={cn("h-3.5", className)} />
  return (
    <span className={cn("h-3.5 leading-none font-semibold", className)}>
      {dot ? "● 오늘" : "오늘"}
    </span>
  )
}

function EatenFoodBars({ ids }: { ids: readonly string[] }) {
  const { year } = useToday()
  return <FoodBars ids={ids} eaten={useEatenIds(year)} />
}

/** 막대 1칸 = 품종 1가지. 먹은 품종은 gold로 채운다(명세 3.2 ②). */
function FoodBars({
  ids,
  eaten,
}: {
  ids: readonly string[]
  eaten: ReadonlySet<string>
}) {
  const count = ids.filter((id) => eaten.has(id)).length
  return (
    <span
      role="img"
      aria-label={`${ids.length}가지 중 ${count}가지 먹음`}
      className="flex h-1.5 gap-px"
    >
      {ids.map((id) => (
        <span
          key={id}
          className={cn(
            "flex-1 rounded-[1px]",
            eaten.has(id) ? "bg-gold" : "bg-hairline"
          )}
        />
      ))}
    </span>
  )
}
