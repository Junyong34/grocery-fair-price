import Link from "next/link"

import { MONTH_NOTES } from "@workspace/seasonal/data/copy"
import { foodsInMonth, monthHighlights } from "@workspace/seasonal/data/foods"
import { MONTHS, type Month } from "@workspace/seasonal/data/months"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"

import { routes } from "@/shared/routes"

import { FoodImage } from "../components/food-image"
import { SeasonBackground } from "../seasons/season-background"
import { SEASON_BACKGROUND, SEASON_COLOR_VAR } from "../seasons/season-style"
import { ThisMonthTag } from "./this-month-tag"

/** 대표 품종 3개를 겹쳐 놓는 자리(그림 영역 대비 %, 기울기). 뒤 → 앞 순서. */
const COLLAGE = [
  { left: 0, top: 18, size: 52, rotate: -7 },
  { left: 44, top: 0, size: 50, rotate: 6 },
  { left: 26, top: 42, size: 54, rotate: 2 },
] as const

/**
 * 2b 월별 보기 첫 화면: 열두 달 카드(3a 계절 카드와 같은 모양). 카드를 누르면 그 달 상세로 간다.
 * 모바일 2열, 태블릿 3열, 데스크톱 4열.
 */
export function MonthsIndex() {
  return (
    <div className="mx-auto max-w-[1080px] px-[18px] pt-4 pb-8 lg:px-6 lg:pt-8">
      <h1 className="sr-only">열두 달 제철</h1>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {MONTHS.map((month) => (
          <li key={month}>
            <MonthCard month={month} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function MonthCard({ month }: { month: Month }) {
  const season = seasonOfMonth(month)
  const foods = foodsInMonth(month)
  const highlights = monthHighlights(month, COLLAGE.length)
  return (
    <Link
      href={routes.seasonal.month(month)}
      aria-label={`${month}월 제철 ${foods.length}가지 보기`}
      className="group/card @container relative isolate flex h-[230px] flex-col overflow-hidden rounded-lg border border-hairline p-3.5 text-ink no-underline transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:text-ink hover:shadow-md hover:shadow-ink/8 lg:h-[290px] lg:p-5"
    >
      <SeasonBackground season={season} variant={SEASON_BACKGROUND} />
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: SEASON_COLOR_VAR[season] }} />

      <div className="flex items-center justify-between gap-2 text-[11px] text-stone lg:text-xs">
        <span>{foods.length}가지 제철</span>
        <ThisMonthTag month={month} />
      </div>
      <p className="mt-1 flex items-baseline gap-0.5 leading-none">
        <span className="font-number text-[52px] tabular-nums lg:text-[68px]">{month}</span>
        <span className="font-heading text-lg lg:text-xl">월</span>
      </p>
      <p className="mt-1.5 line-clamp-2 font-heading text-[13px] leading-snug text-stone lg:text-[15px]">
        {MONTH_NOTES[month]}
      </p>

      {/* 그림은 오른쪽 아래 구석에 크게 겹쳐 놓는다(글과 겹치지 않게 카드 폭의 60%). */}
      <div aria-hidden className="absolute right-1 bottom-1 w-[60%] lg:right-3 lg:bottom-3 lg:w-[58%]">
        <div className="relative aspect-square">
          {highlights.map((food, i) => {
            const spot = COLLAGE[i]!
            return (
              <span
                key={food.id}
                className="absolute block drop-shadow-sm transition-transform duration-300 group-hover/card:scale-105"
                style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.size}%`, rotate: `${spot.rotate}deg` }}
              >
                <FoodImage food={food} sizes="120px" showName={false} />
              </span>
            )
          })}
        </div>
      </div>
      <span
        aria-hidden
        className="absolute bottom-3 left-3.5 grid size-8 place-items-center rounded-full bg-ink text-sm text-canvas lg:bottom-5 lg:left-5 lg:size-9"
      >
        →
      </span>
    </Link>
  )
}
