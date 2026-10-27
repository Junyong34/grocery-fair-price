"use client"

import { useEffect, useRef, useState } from "react"

import { SEASON_COPY, UI_COPY } from "@workspace/seasonal/data/copy"
import {
  scopeFoods,
  tally,
  type Scope,
} from "@workspace/seasonal/data/eaten-stats"
import { FOODS, type Food } from "@workspace/seasonal/data/foods"
import { MONTHS } from "@workspace/seasonal/data/months"
import { SEASONS } from "@workspace/seasonal/data/seasons"
import { matchFoods } from "@workspace/seasonal/search/match-foods"
import { AnimatedNumber } from "@workspace/ui/components/animated-number"
import { Segmented } from "@workspace/ui/components/segmented"
import { cn } from "@workspace/ui/lib/utils"
import { ScrollRow } from "@workspace/ui/components/scroll-row"

import { toggleEaten, useEatenIds } from "@/shared/eaten-store"
import { useToday } from "@/shared/today-context"

import { FoodRow } from "./food-row"
import {
  Meter,
  ScopeSummary,
  scopeFill,
  scopeName,
  type FilterMode,
} from "./scope-summary"

/**
 * 1h 나의 식탁(명세 3.6). "검색 → 필터 → 체크" 흐름이다. 체크하면 +1과 진행률이 함께 움직인다.
 * 올해(서울)의 먹음 기록만 다룬다. 요약의 숫자·진행률·차트는 지금 고른 범위(전체·달·계절)와 필터 방식을 따른다.
 * 모바일은 한 열, 데스크톱은 왼쪽 요약 + 오른쪽 2열 목록.
 */
export function MyTableView() {
  const { year, month: thisMonth } = useToday()
  const eaten = useEatenIds(year)

  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<FilterMode>("month")
  const [scope, setScope] = useState<Scope>(null)
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

  const inScope = scopeFoods(scope)
  const scopeTally = tally(inScope, eaten)
  const yearTally = tally(FOODS, eaten)
  const list = matchFoods(inScope, query)
  const listEaten = list.filter((food) => eaten.has(food.id)).length

  const onToggle = (food: Food) => {
    toggleEaten(year, food.id)
  }

  // 차트에서 다른 방식의 범위를 고르는 일은 없지만, 방식과 범위가 어긋나지 않게 함께 맞춘다.
  const onScope = (next: Scope) => {
    if (next !== null) setMode(typeof next === "number" ? "month" : "season")
    setScope(next)
  }

  return (
    <div className="mx-auto max-w-[900px] px-[18px] pt-6 pb-8 lg:grid lg:grid-cols-[300px_1fr] lg:gap-10 lg:px-6 lg:pt-10">
      {/* 화면에는 요약 카드의 "나의 식탁 · 연도"가 제목 역할을 한다. 문서 제목은 보조기술용으로만 둔다(2b 목록·3a와 같은 방식). sr-only는 absolute라 그리드 칸을 차지하지 않는다. */}
      <h1 className="sr-only">나의 식탁</h1>
      <ScopeSummary
        ref={summaryRef}
        year={year}
        thisMonth={thisMonth}
        mode={mode}
        scope={scope}
        scopeTally={scopeTally}
        yearTally={yearTally}
        eaten={eaten}
        onScope={onScope}
      />

      <section aria-label="제철 목록" className="mt-6 lg:mt-0">
        <div className="sticky top-14 z-(--z-sticky) -mx-[18px] flex flex-col gap-2.5 bg-canvas/94 px-[18px] py-3 backdrop-blur lg:mx-0 lg:px-0">
          {summaryHidden && (
            <div className="flex items-center gap-3 motion-safe:animate-rise lg:hidden">
              <span className="shrink-0 text-xs text-stone">
                {scopeName(scope) ?? "올해"}
              </span>
              <span className="font-number text-xl leading-none tabular-nums">
                <AnimatedNumber
                  value={scopeTally.eaten}
                  format={{ maximumFractionDigits: 0 }}
                />
                <span className="text-xs text-stone"> / {scopeTally.total}</span>
              </span>
              <Meter tally={scopeTally} fill={scopeFill(scope)} className="flex-1" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={UI_COPY.searchPlaceholder}
              aria-label="음식 이름 검색"
              className="h-9 min-w-0 basis-full rounded-md border border-hairline bg-surface px-3 text-base outline-none placeholder:text-caption focus-visible:border-gold min-[480px]:basis-0 min-[480px]:flex-1 lg:w-[280px] lg:basis-auto lg:flex-none"
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
                setScope(null) // 모드를 바꾸면 '전체'로 되돌린다.
              }}
            />
          </div>
          <ScrollRow
            role="group"
            aria-label="필터 값"
            frameClassName="-mx-[18px] lg:mx-0"
            className="gap-1.5 px-[18px] lg:flex-wrap lg:px-0"
          >
            <Chip on={scope === null} onClick={() => setScope(null)}>
              전체
            </Chip>
            {mode === "month"
              ? MONTHS.map((month) => (
                  <Chip
                    key={month}
                    on={scope === month}
                    onClick={() => setScope(month)}
                  >
                    {month}월
                  </Chip>
                ))
              : SEASONS.map((season) => (
                  <Chip
                    key={season}
                    on={scope === season}
                    onClick={() => setScope(season)}
                  >
                    {SEASON_COPY[season].name}
                  </Chip>
                ))}
          </ScrollRow>
        </div>

        {/* 검색어가 없으면 목록이 곧 요약의 범위라 개수가 겹치므로, 검색 중일 때만 결과 수를 보인다. */}
        {/* live 영역은 숨기지 않고 늘 두어야 바뀐 문구가 읽힌다. 비어 있으면 높이가 0이다. */}
        <p aria-live="polite" className="mt-1 text-xs text-caption tabular-nums">
          {query.trim() && list.length > 0
            ? UI_COPY.searchResult(query.trim(), list.length, listEaten)
            : ""}
        </p>
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
  // 요약 차트에서 범위를 고르면 칩 줄 밖에 있던 칩도 가운데로 끌어온다.
  // scrollIntoView는 페이지까지 세로로 움직이므로 부모(ScrollRow 스크롤 영역)만 가로로 민다.
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const chip = ref.current
    const row = chip?.parentElement
    if (!on || !chip || !row) return
    const c = chip.getBoundingClientRect()
    const r = row.getBoundingClientRect()
    if (c.left >= r.left && c.right <= r.right) return
    row.scrollBy({
      left: c.left - r.left - (r.width - c.width) / 2,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }, [on])
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-[4px] border px-2.5 py-1.5 text-xs transition-colors duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-gold",
        on
          ? "border-gold bg-gold-wash text-gold-deep"
          : "border-hairline text-stone hover:border-silver hover:text-ink"
      )}
    >
      {children}
    </button>
  )
}
