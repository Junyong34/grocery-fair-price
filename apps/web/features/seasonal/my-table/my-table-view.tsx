"use client"

import { useDeferredValue, useEffect, useRef, useState } from "react"

import {
  MY_TABLE_COPY,
  SEASON_COPY,
  UI_COPY,
} from "@workspace/seasonal/data/copy"
import {
  scopeFoods,
  tally,
  type Scope,
} from "@workspace/seasonal/data/eaten-stats"
import { FOODS, type FoodCategory } from "@workspace/seasonal/data/foods"
import { MONTHS } from "@workspace/seasonal/data/months"
import { SEASONS } from "@workspace/seasonal/data/seasons"
import { matchFoods } from "@workspace/seasonal/search/match-foods"
import { AnimatedNumber } from "@workspace/ui/components/animated-number"
import { Segmented } from "@workspace/ui/components/segmented"
import { ScrollRow } from "@workspace/ui/components/scroll-row"

import { useEatenIds } from "@/shared/eaten-store"
import { useToday } from "@/shared/today-context"

import { PillButton } from "../components/pill"
import { stepIn } from "../components/swipe-gesture"
import { useSwipe } from "../components/use-swipe"
import { FoodRow } from "./food-row"
import { CategoryFilter } from "./category-filter"
import {
  Meter,
  ScopeSummary,
  scopeFill,
  scopeName,
  type FilterMode,
} from "./scope-summary"

/** 목록을 밀어 필터를 바꾸는 순서. 전체에서 시작하고 끝에서 멈춘다. */
const SCOPE_ORDER: Record<FilterMode, readonly Scope[]> = {
  month: [null, ...MONTHS],
  season: [null, ...SEASONS],
}

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
  const [category, setCategory] = useState<FoodCategory | null>(null)
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
  // 목록은 늦춘 검색어로 거른다. 입력창은 바로 바뀌고, 200여 행을 다시 거르는 일은 그 뒤에 한다.
  const deferredQuery = useDeferredValue(query)
  const list = matchFoods(scopeFoods(scope, category), deferredQuery)
  const listEaten = list.filter((food) => eaten.has(food.id)).length
  const hasQuery = deferredQuery.trim().length > 0
  const hasFilters = scope !== null || category !== null

  // 차트에서 다른 방식의 범위를 고르는 일은 없지만, 방식과 범위가 어긋나지 않게 함께 맞춘다.
  const onScope = (next: Scope) => {
    if (next !== null) setMode(typeof next === "number" ? "month" : "season")
    setScope(next)
  }

  // 체크박스에서 시작한 터치는 use-swipe가 거른다. 행의 다른 곳에서 민 터치는 탭이 아니라 체크되지 않는다.
  const listArea = useSwipe<HTMLDivElement>((direction) => {
    setScope(stepIn(SCOPE_ORDER[mode], scope, direction))
  })

  return (
    <div className="mx-auto max-w-[1080px] px-[18px] pt-6 pb-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 lg:px-6 lg:pt-8">
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
        <div className="sticky top-14 z-(--z-sticky) -mx-[18px] flex flex-col gap-3 bg-canvas px-[18px] py-3 lg:mx-0 lg:px-0 lg:pt-0">
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
                <span className="text-xs text-stone">
                  {" "}
                  / {scopeTally.total}
                </span>
              </span>
              <Meter
                tally={scopeTally}
                fill={scopeFill(scope)}
                className="flex-1"
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={UI_COPY.searchPlaceholder}
              aria-label="음식 이름 검색"
              className="h-11 min-w-0 basis-full rounded-lg border border-hairline bg-surface/40 px-3 text-base outline-none placeholder:text-stone focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold min-[480px]:flex-1 min-[480px]:basis-0"
            />
            <div className="flex w-full items-center justify-between gap-2 min-[480px]:w-auto">
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
              <CategoryFilter value={category} onChange={setCategory} />
            </div>
          </div>
          <ScrollRow
            role="group"
            aria-label="필터 값"
            frameClassName="-mx-[18px] lg:mx-0"
            className="gap-1.5 px-[18px] py-1 lg:flex-wrap lg:px-0"
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

        <div ref={listArea}>
          {/* 검색·카테고리가 적용되면 목록과 시기 요약의 범위가 다르므로 별도 집계한다. */}
          {/* live 영역은 숨기지 않고 늘 두어야 바뀐 문구가 읽힌다. 비어 있으면 높이가 0이다. */}
          <p aria-live="polite" className="mt-1 text-xs break-words text-stone tabular-nums">
            {hasQuery || category !== null
              ? MY_TABLE_COPY.listResult(
                  scopeName(scope),
                  category,
                  deferredQuery,
                  list.length,
                  listEaten
                )
              : ""}
          </p>
          {list.length ? (
            <ul className="mt-3 grid lg:grid-cols-2 lg:gap-x-6">
              {list.map((food) => (
                <FoodRow key={food.id} food={food} year={year} />
              ))}
            </ul>
          ) : (
            <div className="my-8 rounded-xl border border-dashed border-hairline bg-surface/30 px-5 py-8 text-center text-sm leading-relaxed text-stone">
              <p className="font-medium break-words text-ink">
                {MY_TABLE_COPY.emptyTitle(deferredQuery, hasFilters)}
              </p>
              <p className="mt-2">
                {hasQuery
                  ? hasFilters
                    ? MY_TABLE_COPY.emptyFilterHint
                    : MY_TABLE_COPY.emptySearchHint
                  : MY_TABLE_COPY.emptyScopeHint}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {category !== null && (
                  <button
                    type="button"
                    onClick={() => setCategory(null)}
                    className="min-h-11 rounded-full border border-hairline px-4 hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    {MY_TABLE_COPY.clearCategory}
                  </button>
                )}
                {hasQuery && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="min-h-11 rounded-full border border-hairline px-4 hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    {MY_TABLE_COPY.clearQuery}
                  </button>
                )}
                {scope !== null && (
                  <button
                    type="button"
                    onClick={() => setScope(null)}
                    className="min-h-11 rounded-full border border-hairline px-4 hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    {MY_TABLE_COPY.clearScope}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
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
    <PillButton ref={ref} selected={on} onClick={onClick}>
      {children}
    </PillButton>
  )
}
