"use client"

import { ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Suspense, useId, useState } from "react"

import { INGREDIENT_COPY as COPY } from "@workspace/seasonal/data/copy"
import { isDrawn, type Food, type FoodCategory } from "@workspace/seasonal/data/foods"
import {
  seasonRuns,
  type MONTHLY_INGREDIENT_CATEGORIES,
} from "@workspace/seasonal/data/ingredient-calendar"
import { formatSeasonMonths, MONTHS } from "@workspace/seasonal/data/months"
import { ScrollRow } from "@workspace/ui/components/scroll-row"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"
import { useToday } from "@/shared/today-context"

import { FoodImage } from "../components/food-image"
import { PillButton } from "../components/pill"

const PREVIEW_COUNT = 8
/** 이번 달 띠에 늘어놓는 품종 칸 수(넘으면 마지막 칸이 "+N"). */
const NOW_ITEMS = 10

type MonthlyCategory = (typeof MONTHLY_INGREDIENT_CATEGORIES)[number]

type CalendarFood = Pick<Food, "id" | "name"> & { months: readonly number[] }

type CalendarGroup = {
  category: FoodCategory
  monthlyCategory?: MonthlyCategory
  foods: readonly CalendarFood[]
}

/**
 * 제철 식재료 달력. 카테고리 알약 → 이번 달 띠 → 품종별 1~12월 막대 표 순서다.
 * 오늘의 달은 서버 요청마다 정해지므로(useToday) 그 부분만 <Suspense> 안에서 그리고, 기다리는 동안은 달 강조 없이 같은 모양을 보인다.
 */
export function IngredientCalendar({
  groups,
  initialCategory,
}: {
  groups: readonly CalendarGroup[]
  initialCategory: FoodCategory
}) {
  const [category, setCategory] = useState(initialCategory)
  const [expanded, setExpanded] = useState(false)
  const group = groups.find((group) => group.category === category) ?? groups[0]

  const select = (next: FoodCategory) => {
    setCategory(next)
    setExpanded(false)
    // 고른 카테고리를 주소에 남겨 공유·뒤로 가기·월별 화면의 "← 달력" 링크가 같은 칸으로 돌아오게 한다.
    window.history.replaceState(null, "", routes.seasonal.ingredientsFor(next))
  }

  if (!group) return null
  const body = (month: number | null) => (
    <CalendarBody
      group={group}
      month={month}
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
    />
  )

  return (
    <>
      <div
        role="group"
        aria-label="식재료 카테고리"
        className="flex flex-wrap gap-1.5 py-1"
      >
        {groups.map(({ category: value }) => (
          <PillButton
            key={value}
            selected={category === value}
            className="h-11 px-3.5 after:hidden"
            onClick={() => select(value)}
          >
            {value}
          </PillButton>
        ))}
      </div>

      <Suspense fallback={body(null)}>
        <WithToday render={body} />
      </Suspense>
    </>
  )
}

function WithToday({ render }: { render: (month: number) => React.ReactNode }) {
  return render(useToday().month)
}

function CalendarBody({
  group,
  month,
  expanded,
  onToggle,
}: {
  group: CalendarGroup
  /** 오늘의 달. 아직 모르면 null(이번 달 띠는 자리만 잡고 표는 강조 없이 그린다). */
  month: number | null
  expanded: boolean
  onToggle: () => void
}) {
  const rowsId = useId()
  const { category, foods } = group
  const visible = expanded ? foods : foods.slice(0, PREVIEW_COUNT)

  return (
    <>
      <NowBand group={group} month={month} />

      <div className="mt-8 mb-1 flex items-center justify-between gap-3">
        <h2 aria-live="polite" className="text-base font-semibold">
          {COPY.count(category, foods.length)}
        </h2>
        <div aria-hidden className="flex items-center gap-3 text-xs text-caption">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-gold" />
            {COPY.legendSeason}
          </span>
          {month !== null && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-gold-deep" />
              {COPY.inSeasonNow}
            </span>
          )}
        </div>
      </div>

      <table
        aria-label="식재료별 제철 기간"
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr className="border-b border-hairline text-[11px] text-caption tabular-nums sm:text-xs">
            <th
              scope="col"
              className="h-9 w-[100px] pr-1 text-left font-medium sm:w-40"
            >
              식재료
            </th>
            {MONTHS.map((value) => (
              <th
                key={value}
                scope="col"
                aria-label={`${value}월`}
                aria-current={value === month ? "date" : undefined}
                className={cn(
                  "text-center font-medium",
                  value === month &&
                    "rounded-t-md bg-gold-wash font-bold text-gold-deep"
                )}
              >
                {value}
                <span className="hidden sm:inline">월</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody id={rowsId}>
          {visible.map((food) => (
            <CalendarRow key={food.id} food={food} month={month} />
          ))}
        </tbody>
      </table>

      {foods.length > PREVIEW_COUNT && (
        <PillButton
          selected={false}
          className="mt-4 h-11 gap-1 px-4 after:hidden"
          aria-controls={rowsId}
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {expanded ? COPY.collapse : COPY.showAll(foods.length)}
          <ChevronDown
            size={16}
            aria-hidden
            className={cn(expanded && "rotate-180")}
          />
        </PillButton>
      )}
    </>
  )
}

/**
 * 한 품종의 줄. 왼쪽은 그림과 이름, 오른쪽은 1~12월 막대다.
 * 막대는 이어진 달마다 하나로 그려(seasonRuns) 칸 사이 이음매가 없고, 해를 넘기는 제철은 12월 끝과 1월 시작을 둥글리지 않아 이어진다는 걸 보인다.
 * 색은 같은 골드의 명도 두 단계다. 제철은 gold(크림 대비 3.5:1), 지금 제철인 품종은 gold-deep(7:1)이라 이번 달 열 위에서도 3:1 이상이다.
 */
function CalendarRow({
  food,
  month,
}: {
  food: CalendarFood
  month: number | null
}) {
  const { id, name, months } = food
  const now = month !== null && months.includes(month)
  const wraps = months.includes(1) && months.includes(12)

  return (
    <tr className="border-b border-hairline">
      <th scope="row" className="py-1.5 pr-1.5 text-left font-normal">
        <Link
          href={routes.seasonal.food(id)}
          scroll={false}
          className="group flex items-center gap-1.5 no-underline sm:gap-2.5"
        >
          <FoodThumb food={food} />
          <span
            className={cn(
              "min-w-0 text-xs leading-tight [overflow-wrap:anywhere] break-keep underline-offset-4 group-hover:underline sm:text-sm",
              now ? "font-semibold text-ink" : "font-medium text-stone"
            )}
          >
            {name}
          </span>
          <span className="sr-only">
            {formatSeasonMonths(months)}
            {now && `, ${COPY.inSeasonNow}`}
          </span>
        </Link>
      </th>
      <td colSpan={MONTHS.length} className="p-0">
        <div aria-hidden className="grid h-12 grid-cols-12 items-center">
          {month !== null && (
            <span
              className="row-start-1 h-full bg-gold-wash"
              style={{ gridColumn: month }}
            />
          )}
          <span className="col-span-full row-start-1 mx-0.5 h-1.5 rounded-full bg-hairline" />
          {seasonRuns(months).map(({ start, end }) => (
            <span
              key={start}
              style={{ gridColumn: `${start} / ${end + 1}` }}
              className={cn(
                "row-start-1 mx-0.5 h-2 rounded-full",
                now ? "bg-gold-deep" : "bg-gold",
                wraps && start === 1 && "ml-0 rounded-l-none",
                wraps && end === 12 && "mr-0 rounded-r-none"
              )}
            />
          ))}
        </div>
      </td>
    </tr>
  )
}

/** 표 줄의 작은 그림. 그림이 아직 없는 품종은 이름 첫 글자를 담은 원으로 자리를 맞춘다. */
function FoodThumb({ food }: { food: CalendarFood }) {
  const box = "grid size-7 shrink-0 place-items-center rounded-full sm:size-9"
  if (!isDrawn(food.id)) {
    return (
      <span
        aria-hidden
        className={cn(box, "bg-mat font-heading text-xs text-caption sm:text-sm")}
      >
        {food.name.slice(0, 1)}
      </span>
    )
  }
  return (
    <span aria-hidden className={cn(box, "bg-pair-light p-0.5")}>
      <FoodImage food={food} showName={false} />
    </span>
  )
}

/**
 * 이번 달 띠. 위 줄은 "11월 제철 ○○ N가지"와 월별 화면 링크, 아래는 지금 제철인 품종을 그림+이름 칸으로 가로로 늘어놓는다.
 * 칸은 품종 상세(시트)로 가고, NOW_ITEMS를 넘으면 마지막 칸이 "+N"으로 월별 화면에 간다. 그림 있는 품종을 먼저 둔다.
 * 수산은 맨 아래에 그 달 제철 회로 가는 줄을 하나 더 둔다(링크를 띠 하나로 모은다).
 * 달을 모를 때는 비슷한 높이의 빈 띠로 자리만 잡는다(레이아웃 밀림 방지).
 */
function NowBand({
  group: { category, foods, monthlyCategory },
  month,
}: {
  group: CalendarGroup
  month: number | null
}) {
  const shell = "mt-5 rounded-xl bg-pair-gold text-pair-gold-foreground"
  if (month === null)
    return <div aria-hidden className={cn(shell, "min-h-[156px]")} />

  const inSeason = foods.filter((food) => food.months.includes(month))
  const ordered = [
    ...inSeason.filter((food) => isDrawn(food.id)),
    ...inSeason.filter((food) => !isDrawn(food.id)),
  ]
  const overflow = monthlyCategory && ordered.length > NOW_ITEMS
  const items = overflow ? ordered.slice(0, NOW_ITEMS - 1) : ordered
  const monthHref =
    monthlyCategory && routes.seasonal.ingredientMonth(monthlyCategory.slug, month)

  return (
    <section aria-labelledby="now-band-title" className={shell}>
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
        <h2
          id="now-band-title"
          className="text-[15px] leading-snug font-semibold text-ink"
        >
          {COPY.nowTitle(month, category === "수산" ? "수산물" : category)}{" "}
          <span className="text-gold-deep tabular-nums">
            {inSeason.length}가지
          </span>
        </h2>
        {monthHref && (
          <Link
            href={monthHref}
            className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium whitespace-nowrap text-gold-deep no-underline underline-offset-4 hover:text-gold-deep hover:underline"
          >
            {COPY.monthlyLink}
            <ArrowRight size={16} aria-hidden />
          </Link>
        )}
      </div>

      {items.length > 0 ? (
        <ScrollRow
          className="gap-1 px-2.5 pt-1 pb-3"
          previousLabel="이전 품종 보기"
          nextLabel="다음 품종 보기"
        >
          {items.map((food, index) => (
            <Link
              key={food.id}
              href={routes.seasonal.food(food.id)}
              scroll={false}
              className="group flex w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-lg py-1.5 text-ink no-underline hover:text-ink"
            >
              <NowThumb food={food} preload={index < 5} />
              <span className="w-full truncate text-center text-xs leading-tight font-medium group-hover:underline underline-offset-4">
                {food.name}
              </span>
            </Link>
          ))}
          {overflow && monthHref && (
            <Link
              href={monthHref}
              aria-label={COPY.moreLabel(ordered.length - items.length)}
              className="group flex w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-lg py-1.5 text-gold-deep no-underline hover:text-gold-deep"
            >
              <span className="grid size-12 place-items-center rounded-full border border-gold-pale bg-pair-light text-sm font-semibold tabular-nums">
                +{ordered.length - items.length}
              </span>
              <span className="text-xs leading-tight font-medium group-hover:underline underline-offset-4">
                {COPY.more}
              </span>
            </Link>
          )}
        </ScrollRow>
      ) : (
        <p className="px-4 pt-1 pb-4 text-[13px] text-stone">{COPY.nowEmpty}</p>
      )}

      {category === "수산" && (
        <Link
          href={routes.seasonal.sashimiMonth(month)}
          className="flex min-h-11 items-center justify-between gap-2 border-t border-gold-pale/60 px-4 text-sm text-ink no-underline underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-gold"
        >
          {COPY.sashimiLink(month)}
          <ArrowRight size={16} aria-hidden className="text-gold-deep" />
        </Link>
      )}
    </section>
  )
}

/** 이번 달 띠의 그림 칸(48px). 그림이 아직 없는 품종은 이름 첫 글자 원으로 자리를 맞춘다. */
function NowThumb({ food, preload }: { food: CalendarFood; preload: boolean }) {
  const box =
    "grid size-12 place-items-center rounded-full bg-pair-light motion-safe:transition-[scale] motion-safe:duration-150 motion-safe:group-hover:scale-105"
  if (!isDrawn(food.id))
    return (
      <span aria-hidden className={cn(box, "font-heading text-base text-caption")}>
        {food.name.slice(0, 1)}
      </span>
    )
  return (
    <span aria-hidden className={cn(box, "p-1")}>
      <FoodImage food={food} showName={false} preload={preload} />
    </span>
  )
}
