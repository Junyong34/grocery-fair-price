import Link from "next/link"

import { holidaysInMonth } from "@workspace/seasonal/calendar/holidays"
import { monthCalendar, type CalendarDate } from "@workspace/seasonal/calendar/month-calendar"
import { MONTH_NOTES, UI_COPY } from "@workspace/seasonal/data/copy"
import { festivalDate, festivalsInMonth } from "@workspace/seasonal/data/festivals"
import { foodsInMonth, monthHighlights } from "@workspace/seasonal/data/foods"
import { MONTHS, type Month } from "@workspace/seasonal/data/months"
import { SCATTER_MAX_FOODS } from "@workspace/seasonal/layout/scatter"
import { TextReveal } from "@workspace/ui/components/text-reveal"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { DownloadsCard } from "../components/downloads-card"
import { ScatterField } from "../components/scatter-field"
import { HERO_ID, monthSectionId } from "./active-month"
import { DesktopMonthPanel } from "./desktop-month-panel"
import { JumpButton, MonthRail } from "./month-jump"
import { MonthScrollSpy } from "./month-scroll-spy"
import { MonthTitle } from "./month-title"
import { MoreFoods } from "./more-foods"
import { SettingsCalendar, SettingsScope } from "./settings-scope"
import { YearEnd } from "./year-end"

/**
 * 2a 이달 · 12개월 스크롤(명세 3.1). 각 달은 "흩어진 제철 그림 → 달력" 순서다.
 * 모바일은 한 열 + 위 인디케이터 + 오른쪽 월 레일, 데스크톱은 왼쪽 고정 패널(달 이동 휠) + 오른쪽 스크롤.
 */
export function ThisMonthView({ today }: { today: CalendarDate }) {
  const { year, month: thisMonth } = today
  // 판에는 그 달 대표 품종만 그린다(한 달 제철이 최대 86개라 다 그리면 그림과 이름표가 겹친다). 나머지는 판 아래 이름 목록이다.
  const months = MONTHS.map((month) => ({ month, foods: foodsInMonth(month), pictured: monthHighlights(month, SCATTER_MAX_FOODS), note: MONTH_NOTES[month] }))
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
          <section id={HERO_ID} aria-labelledby="hero-title" className="scroll-mt-16 pr-12 pl-[18px] pt-10 pb-7 lg:scroll-mt-16 lg:px-0 lg:pt-12">
            {/* 첫 화면에서 한 번만 부드럽게 나타난다. 제목 다음에 설명이 이어진다. */}
            <TextReveal
              as="h1"
              id="hero-title"
              text={`지금은 ${thisMonth}월`}
              variant="soften"
              split="grapheme"
              duration={500}
              className="font-heading text-[46px] leading-tight lg:text-[64px]"
            />
            <TextReveal
              as="p"
              text={current.note}
              variant="fade"
              stagger={40}
              duration={600}
              className="mt-1 block font-heading text-lg text-stone lg:text-[22px]"
            />
            <div className="lg:mt-6">
              <div>
                <Scatter month={thisMonth} foods={current.pictured} year={year} className="mt-6 lg:mt-0" desktopFrame="desktopHero" />
                <p className="mt-3 text-xs text-caption">
                  {current.foods.length}가지 제철<span className="hidden lg:inline"> · 그림을 끌어 옮겨 보세요</span>
                </p>
              </div>
              <div className="lg:mt-5 lg:flex lg:items-center lg:gap-5">
                <div className="mt-5 flex flex-wrap items-center gap-2 lg:mt-0">
                  <JumpButton month={thisMonth}>{thisMonth}월 달력 보기 ↓</JumpButton>
                  <JumpButton month={1} variant="outline">
                    1월부터
                  </JumpButton>
                </div>
                <Link href={routes.seasonal.month(thisMonth)} className="mt-4 inline-block text-sm text-stone lg:mt-0">
                  월별 제철 타임라인 →
                </Link>
              </div>
              <DownloadsCard className="mt-6 lg:max-w-[420px]" />
            </div>
          </section>

          {months.map(({ month, foods, pictured, note }) => (
            <MonthSection key={month} month={month} foods={foods} pictured={pictured} note={note} today={today} />
          ))}

          <YearEnd year={year} thisMonth={thisMonth} />
        </div>
      </div>
      <MonthRail />
    </SettingsScope>
  )
}

function MonthSection({
  month,
  foods,
  pictured,
  note,
  today,
}: {
  month: Month
  foods: ReturnType<typeof foodsInMonth>
  /** 판에 그리는 대표 품종(foods의 일부) */
  pictured: ReturnType<typeof foodsInMonth>
  note: string
  today: CalendarDate
}) {
  const festivals = festivalsInMonth(month, today.year)
  const holidays = holidaysInMonth(today.year, month)
  // 모바일 판은 달력(고정)이 들어갈 높이가 달의 주 수에 따라 다르다.
  const weeks = monthCalendar({ year: today.year, month, today, holidays }).length
  return (
    <section
      id={monthSectionId(month)}
      data-month={month}
      aria-label={`${month}월`}
      className="scroll-mt-16 border-t border-hairline pr-12 pl-[18px] pt-12 pb-7 lg:scroll-mt-16 lg:px-0 lg:pt-8"
    >
      <div className="lg:flex lg:items-baseline lg:gap-4">
        <h2 className="font-number text-[88px] leading-[0.9] tabular-nums lg:font-heading lg:text-[28px] lg:leading-none lg:font-bold">
          <MonthTitle
            month={month}
            suffixClassName="ml-1 font-heading text-[40px] lg:ml-0 lg:text-[28px]"
            englishClassName="text-[56px] lg:text-[28px]"
          />
        </h2>
        <p className="hidden flex-1 font-heading text-lg text-stone lg:block">{note}</p>
      </div>
      <p className="mt-2 font-heading text-[19px] text-stone lg:hidden">{note}</p>
      <div className="lg:mt-5">
        <Scatter
          month={month}
          foods={pictured}
          year={today.year}
          className="mt-5 lg:mt-0"
          desktopFrame="desktopMonth"
          desktopCalendar={<SettingsCalendar year={today.year} month={month} today={today} holidays={holidays} />}
          mobileFrame={weeks >= 6 ? "mobileMonthTall" : "mobileMonth"}
          mobileCalendar={<SettingsCalendar year={today.year} month={month} today={today} holidays={holidays} />}
        />
        <p className="mt-3 text-xs text-caption">
          {foods.length}가지 제철<span> · 그림을 끌어 달력 위에도 놓아 꾸며 보세요</span>
        </p>
        <MoreFoods foods={foods.filter((food) => !pictured.includes(food))} />
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
      </div>
    </section>
  )
}

/** 모바일·데스크톱 프레임의 배치를 모두 그리고 화면 폭에 따라 하나만 보인다(하이드레이션 차이가 없다). desktopCalendar가 있으면 데스크톱 판 위에 달력을 얹는다. */
function Scatter({
  month,
  foods,
  year,
  className,
  desktopFrame = "desktop",
  desktopCalendar,
  mobileFrame = "mobile",
  mobileCalendar,
}: {
  month: number
  foods: ReturnType<typeof foodsInMonth>
  year: number
  className?: string
  desktopFrame?: "desktop" | "desktopMonth" | "desktopHero"
  desktopCalendar?: React.ReactNode
  mobileFrame?: "mobile" | "mobileMonth" | "mobileMonthTall"
  mobileCalendar?: React.ReactNode
}) {
  return (
    <div className={cn(className)}>
      <ScatterField month={month} foods={foods} year={year} frame={mobileFrame} className="lg:hidden">
        {mobileCalendar}
      </ScatterField>
      <ScatterField month={month} foods={foods} year={year} frame={desktopFrame} className="hidden lg:block">
        {desktopCalendar}
      </ScatterField>
    </div>
  )
}
