"use client"

import { useEffect, useRef, useState } from "react"

import { SEASON_COPY, UI_COPY } from "@workspace/seasonal/data/copy"
import { FOODS, type Food } from "@workspace/seasonal/data/foods"
import { MONTHS } from "@workspace/seasonal/data/months"
import {
  SEASONS,
  SEASON_MONTHS,
  type Season,
} from "@workspace/seasonal/data/seasons"
import { matchFoods } from "@workspace/seasonal/search/match-foods"
import { AnimatedNumber } from "@workspace/ui/components/animated-number"
import { Segmented } from "@workspace/ui/components/segmented"
import { cn } from "@workspace/ui/lib/utils"
import { ScrollRow } from "@workspace/ui/components/scroll-row"

import { useEatenIds, useEatenStore } from "@/shared/eaten-store"
import { useToday } from "@/shared/today-context"

import { FoodRow } from "./food-row"

type FilterMode = "month" | "season"
/** 0이면 전체. 월별이면 1~12, 계절별이면 계절. */
type FilterValue = 0 | number | Season

const TOTAL = FOODS.length

const inSeason = (food: Food, season: Season) =>
  food.months.some((month) => SEASON_MONTHS[season].includes(month))

/**
 * 1h 나의 식탁(명세 3.6). "검색 → 필터 → 체크" 흐름이다. 체크하면 +1과 진행률이 함께 움직인다.
 * 올해(서울)의 먹음 기록만 다룬다. 모바일은 한 열, 데스크톱은 왼쪽 요약 + 오른쪽 2열 목록.
 */
export function MyTableView() {
  const { year, month: thisMonth } = useToday()
  const eaten = useEatenIds(year)
  const toggle = useEatenStore((state) => state.toggle)

  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<FilterMode>("month")
  const [value, setValue] = useState<FilterValue>(0)
  // 큰 요약이 화면 밖으로 나가면 sticky 영역에 한 줄 요약을 띄운다(모바일).
  const summaryRef = useRef<HTMLParagraphElement>(null)
  const [summaryHidden, setSummaryHidden] = useState(false)
  useEffect(() => {
    const el = summaryRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) =>
        setSummaryHidden(
          !entry!.isIntersecting && entry!.boundingClientRect.top < 0
        ),
      { rootMargin: "-56px 0px 0px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const count = FOODS.filter((food) => eaten.has(food.id)).length

  let list = matchFoods(FOODS, query)
  if (value) {
    list =
      mode === "month"
        ? list.filter((food) =>
            (food.months as readonly number[]).includes(value as number)
          )
        : list.filter((food) => inSeason(food, value as Season))
  }

  const onToggle = (food: Food) => {
    toggle(year, food.id)
  }

  return (
    <>
      <div className="mx-auto max-w-[900px] px-[18px] pt-6 pb-8 lg:grid lg:grid-cols-[300px_1fr] lg:gap-10 lg:px-6 lg:pt-10">
        <Summary
          ref={summaryRef}
          year={year}
          thisMonth={thisMonth}
          count={count}
          eaten={eaten}
        />

        <section aria-label="제철 목록" className="mt-6 lg:mt-0">
          <div className="sticky top-14 z-(--z-sticky) -mx-[18px] flex flex-col gap-2.5 bg-canvas/94 px-[18px] py-3 backdrop-blur lg:mx-0 lg:px-0">
            {summaryHidden && (
              <div className="flex items-center gap-3 motion-safe:animate-rise lg:hidden">
                <span className="font-number text-xl leading-none tabular-nums">
                  <AnimatedNumber
                    value={count}
                    format={{ maximumFractionDigits: 0 }}
                  />
                  <span className="text-xs text-stone"> / {TOTAL}</span>
                </span>
                <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-hairline">
                  <span
                    className="block h-full rounded-full bg-gold transition-[width] duration-400"
                    style={{ width: `${(count / TOTAL) * 100}%` }}
                  />
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="음식 이름 검색 (예: 사과, ㅅㄱ)"
                aria-label="음식 이름 검색"
                className="h-9 min-w-0 flex-1 rounded-md border border-hairline bg-surface px-3 text-base outline-none placeholder:text-ash focus-visible:border-gold lg:w-[280px] lg:flex-none"
              />
              <Segmented
                aria-label="필터 방식"
                options={[
                  { value: "month", label: "월별" },
                  { value: "season", label: "계절별" },
                ]}
                value={mode}
                onValueChange={(next: FilterMode) => {
                  setMode(next)
                  setValue(0) // 모드를 바꾸면 '전체'로 되돌린다.
                }}
              />
            </div>
            <ScrollRow
              role="group"
              aria-label="필터 값"
              frameClassName="-mx-[18px] lg:mx-0"
              className="gap-1.5 px-[18px] lg:flex-wrap lg:px-0"
            >
              <Chip on={value === 0} onClick={() => setValue(0)}>
                전체
              </Chip>
              {mode === "month"
                ? MONTHS.map((month) => (
                    <Chip
                      key={month}
                      on={value === month}
                      onClick={() => setValue(month)}
                    >
                      {month}월
                    </Chip>
                  ))
                : SEASONS.map((season) => (
                    <Chip
                      key={season}
                      on={value === season}
                      onClick={() => setValue(season)}
                    >
                      {SEASON_COPY[season].name}
                    </Chip>
                  ))}
            </ScrollRow>
          </div>

          {list.length ? (
            <ul className="mt-2 grid lg:grid-cols-2 lg:gap-x-6">
              {list.map((food) => (
                <FoodRow
                  key={food.id}
                  food={food}
                  eaten={eaten.has(food.id)}
                  onToggle={() => onToggle(food)}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-center text-sm text-stone">
              {UI_COPY.emptySearch(query)}
            </p>
          )}
        </section>
      </div>
    </>
  )
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-[4px] border px-2.5 py-1.5 text-xs",
        on
          ? "border-gold bg-gold-wash text-gold-deep"
          : "border-hairline text-stone hover:text-ink"
      )}
    >
      {children}
    </button>
  )
}

/** 올해 기록 요약: 개수, 진행률, 월별 막대(데스크톱은 계절별 진행 바도). */
function Summary({
  ref,
  year,
  thisMonth,
  count,
  eaten,
}: {
  ref: React.Ref<HTMLParagraphElement>
  year: number
  thisMonth: number
  count: number
  eaten: ReadonlySet<string>
}) {
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
      <p className="text-sm text-stone">나의 식탁 · {year}</p>
      <p ref={ref} className="flex items-baseline gap-2">
        <AnimatedNumber
          value={count}
          // 올라가는 동안에도 정수만 보인다(기본 형식은 소수 셋째 자리까지 그려 폭이 흔들린다).
          format={{ maximumFractionDigits: 0 }}
          className="font-number text-[60px] leading-none tabular-nums lg:text-[84px]"
        />
        <span className="text-sm text-stone">
          가지 제철을 먹었어요 / {TOTAL}
        </span>
      </p>
      <div
        role="progressbar"
        aria-label="올해 먹은 제철 비율"
        aria-valuemin={0}
        aria-valuemax={TOTAL}
        aria-valuenow={count}
        className="h-[5px] overflow-hidden rounded-full bg-hairline"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-400"
          style={{ width: `${(count / TOTAL) * 100}%` }}
        />
      </div>
      <MonthBars thisMonth={thisMonth} eaten={eaten} />
      <SeasonBars eaten={eaten} />
    </aside>
  )
}

/** 월별 막대 12개. 높이는 그 달에 제철인 품종 가운데 먹은 수(4가지면 가득). */
function MonthBars({
  thisMonth,
  eaten,
}: {
  thisMonth: number
  eaten: ReadonlySet<string>
}) {
  return (
    <div
      className="grid grid-cols-12 items-end gap-1"
      role="img"
      aria-label="달마다 먹은 제철 수"
    >
      {MONTHS.map((month) => {
        const k = FOODS.filter(
          (food) =>
            (food.months as readonly number[]).includes(month) &&
            eaten.has(food.id)
        ).length
        return (
          <div key={month} className="flex flex-col items-center gap-1">
            <div className="flex h-[46px] w-full items-end lg:h-[70px]">
              <div
                className={cn(
                  "w-full rounded-t-[2px] transition-[height] duration-400",
                  k > 0 ? "bg-gold-soft" : "bg-hairline",
                  month === thisMonth && "outline outline-1 outline-ink"
                )}
                style={{ height: `${Math.max(6, Math.min(1, k / 4) * 100)}%` }}
              />
            </div>
            <span
              className={cn(
                "text-[10px] text-ash tabular-nums",
                month === thisMonth && "font-semibold text-ink"
              )}
            >
              {month}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** 데스크톱 계절별 진행 바 4줄("봄 ▬▬ k/t"). */
function SeasonBars({ eaten }: { eaten: ReadonlySet<string> }) {
  return (
    <ul className="hidden flex-col gap-2 lg:flex">
      {SEASONS.map((season) => {
        const foods = FOODS.filter((food) => inSeason(food, season))
        const k = foods.filter((food) => eaten.has(food.id)).length
        return (
          <li
            key={season}
            className="grid grid-cols-[32px_1fr_44px] items-center gap-2 text-xs text-stone"
          >
            <span>{SEASON_COPY[season].name}</span>
            <span className="h-1 overflow-hidden rounded-full bg-hairline">
              <span
                className="block h-full bg-gold transition-[width] duration-400"
                style={{ width: `${(k / foods.length) * 100}%` }}
              />
            </span>
            <span className="text-right tabular-nums">
              {k}/{foods.length}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
