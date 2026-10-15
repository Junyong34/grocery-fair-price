import Link from "next/link"

import type { CalendarDate } from "@workspace/seasonal/calendar/month-calendar"
import { MONTH_NOTES, UI_COPY } from "@workspace/seasonal/data/copy"
import { festivalDate, festivalsInMonth } from "@workspace/seasonal/data/festivals"
import { foodsInMonth } from "@workspace/seasonal/data/foods"
import { MONTHS, type Month } from "@workspace/seasonal/data/months"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { EatenCount } from "../components/eaten-count"
import { ScatterField } from "../components/scatter-field"
import { HERO_ID, monthSectionId } from "./active-month"
import { DesktopMonthPanel } from "./desktop-month-panel"
import { JumpButton, MonthRail } from "./month-jump"
import { MonthScrollSpy } from "./month-scroll-spy"
import { SettingsCalendar, SettingsScope } from "./settings-scope"

/**
 * 2a 이달 · 12개월 스크롤(명세 3.1). 각 달은 "흩어진 제철 그림 → 달력" 순서다.
 * 모바일은 한 열 + 위 인디케이터 + 오른쪽 월 레일, 데스크톱은 왼쪽 고정 패널(달 이동 휠) + 오른쪽 스크롤.
 */
export function ThisMonthView({ today }: { today: CalendarDate }) {
  const { year, month: thisMonth } = today
  const months = MONTHS.map((month) => ({ month, foods: foodsInMonth(month), note: MONTH_NOTES[month] }))
  const current = months[thisMonth - 1]!

  return (
    <SettingsScope>
      <MonthScrollSpy />
      <div className="mx-auto max-w-[600px] lg:grid lg:max-w-[1080px] lg:grid-cols-[280px_1fr] lg:px-6">
        <aside className="hidden lg:block">
          <div className="sticky top-16 max-h-[calc(100svh-64px)] overflow-y-auto">
            <DesktopMonthPanel
              thisMonth={thisMonth}
              months={months.map(({ month, foods, note }) => ({ month, note, count: foods.length }))}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <section id={HERO_ID} aria-labelledby="hero-title" className="scroll-mt-16 pr-11 pl-[18px] pt-10 pb-7 lg:scroll-mt-16 lg:px-0 lg:pt-12">
            <h1 id="hero-title" className="font-heading text-[46px] leading-tight lg:text-[64px]">
              지금은 {thisMonth}월
            </h1>
            <p className="mt-1 font-heading text-lg text-stone lg:text-[22px]">{current.note}</p>
            <Scatter month={thisMonth} foods={current.foods} year={year} className="mt-6" />
            <p className="mt-3 text-xs text-ash">{current.foods.length}가지 제철</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <JumpButton month={thisMonth}>{thisMonth}월 달력 보기 ↓</JumpButton>
              <JumpButton month={1} variant="outline">
                1월부터
              </JumpButton>
            </div>
            <Link href={routes.seasonal.month(thisMonth)} className="mt-4 inline-block text-sm text-stone">
              월별 제철 타임라인 →
            </Link>
          </section>

          {months.map(({ month, foods, note }) => (
            <MonthSection key={month} month={month} foods={foods} note={note} today={today} />
          ))}

          <footer className="flex flex-col gap-4 border-t border-hairline pr-11 pl-[18px] pt-12 pb-10 lg:px-0">
            <p className="font-heading text-2xl">{UI_COPY.yearEnd}</p>
            <Link
              href={routes.seasonal.myTable}
              className="rounded-md border border-gold px-4 py-3 text-ink no-underline hover:bg-gold-wash hover:text-ink"
            >
              나의 식탁 · 올해 <EatenCount year={year} />가지 →
            </Link>
            <nav aria-label="다른 화면" className="grid grid-cols-3 gap-2 text-center text-sm">
              {[
                ["월별", routes.seasonal.month(thisMonth)],
                ["계절", routes.seasonal.seasons],
                ["명절", routes.seasonal.festivals],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href!}
                  className="rounded-md border border-hairline py-2.5 text-ink no-underline hover:bg-surface hover:text-ink"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </footer>
        </div>
      </div>
      <MonthRail />
    </SettingsScope>
  )
}

function MonthSection({
  month,
  foods,
  note,
  today,
}: {
  month: Month
  foods: ReturnType<typeof foodsInMonth>
  note: string
  today: CalendarDate
}) {
  const festivals = festivalsInMonth(month, today.year)
  return (
    <section
      id={monthSectionId(month)}
      data-month={month}
      aria-label={`${month}월`}
      className="scroll-mt-16 border-t border-hairline pr-11 pl-[18px] pt-12 pb-7 lg:scroll-mt-16 lg:px-0 lg:pt-8"
    >
      <div className="lg:flex lg:items-center lg:gap-6">
        <h2 className="font-number text-[88px] leading-[0.9] tabular-nums lg:text-[72px]">{month}</h2>
        <p className="hidden flex-1 font-heading text-lg text-stone lg:block">{note}</p>
      </div>
      <p className="mt-2 font-heading text-[19px] text-stone lg:hidden">{note}</p>
      <Scatter month={month} foods={foods} year={today.year} className="mt-5" />
      <p className="mt-3 text-xs text-ash">{foods.length}가지 제철</p>
      <div className="mt-5">
        <SettingsCalendar year={today.year} month={month} today={today} />
      </div>
      <p className="mt-3 text-xs text-stone">
        {festivals.length
          ? `명절 ${festivals
              .map((festival) => {
                const date = festivalDate(festival.slug, today.year)
                return date ? `${festival.name} ${date.month}.${date.day}` : festival.name
              })
              .join(" · ")}`
          : UI_COPY.noFestivalThisMonth}
      </p>
    </section>
  )
}

/** 모바일·데스크톱 프레임의 배치를 모두 그리고 화면 폭에 따라 하나만 보인다(하이드레이션 차이가 없다). */
function Scatter({
  month,
  foods,
  year,
  className,
}: {
  month: number
  foods: ReturnType<typeof foodsInMonth>
  year: number
  className?: string
}) {
  return (
    <div className={cn(className)}>
      <ScatterField month={month} foods={foods} year={year} frame="mobile" className="lg:hidden" />
      <ScatterField month={month} foods={foods} year={year} frame="desktop" className="hidden lg:block" />
    </div>
  )
}
