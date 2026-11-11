import { holidaysInMonth } from "@workspace/seasonal/calendar/holidays"
import { monthCalendar, type CalendarDate } from "@workspace/seasonal/calendar/month-calendar"
import { MONTH_NOTES } from "@workspace/seasonal/data/copy"
import { foodsInMonth, monthHighlights } from "@workspace/seasonal/data/foods"
import type { Month } from "@workspace/seasonal/data/months"
import { SCATTER_MAX_FOODS } from "@workspace/seasonal/layout/scatter"
import { cn } from "@workspace/ui/lib/utils"

import { MonthDaysCard } from "../components/month-days-card"
import { ScatterField } from "../components/scatter-field"
import { MonthTitle } from "./month-title"
import { MoreFoods } from "./more-foods"
import { SettingsCalendar } from "./settings-scope"

/** 오늘 표시가 없는 날짜. 주 수를 셀 때 쓴다. */
const NO_TODAY: CalendarDate = { year: 0, month: 0, day: 0 }

/** 그 달의 제철 품종, 판에 그릴 대표 품종, 달 메모. 판에는 SCATTER_MAX_FOODS개까지 그린다(한 달 제철이 최대 92개라 다 그리면 너무 빽빽하다). 나머지는 판 아래 이름 목록이다. */
export function monthContent(month: Month) {
  return { foods: foodsInMonth(month), pictured: monthHighlights(month, SCATTER_MAX_FOODS), note: MONTH_NOTES[month] }
}

/**
 * 2a 달 섹션의 내용(제목 · 판 · 달력 · 더 보기 · 절기 카드). 틀(MonthShell) 안에 놓는다.
 * 이번 달과 다음 달은 서버가 그리고, 나머지 달은 LazyMonth가 이 모듈을 따로 받아 브라우저에서 그린다.
 */
export function MonthSectionBody({
  year,
  month,
  isThisMonth = false,
}: {
  year: number
  month: Month
  /** 이번 달 섹션만 오늘 표시를 켠다. 다른 달에는 오늘이 없다. */
  isThisMonth?: boolean
}) {
  const { foods, pictured, note } = monthContent(month)
  const holidays = holidaysInMonth(year, month)
  // 모바일 판은 달력(고정)이 들어갈 높이가 달의 주 수에 따라 다르다.
  const weeks = monthCalendar({ year, month, today: NO_TODAY, holidays }).length
  // 이번 달만 날마다 오늘 모양을 숨겨 두고 브라우저가 그날 것을 켠다(shared/today-mark). 다른 달은 오늘이 들 일이 없다.
  const calendar = () => <SettingsCalendar year={year} month={month} markToday={isThisMonth} holidays={holidays} />
  return (
    <>
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
          year={year}
          className="mt-5 lg:mt-0"
          desktopFrame="desktopMonth"
          desktopCalendar={calendar()}
          mobileFrame={weeks >= 6 ? "mobileMonthTall" : "mobileMonth"}
          mobileCalendar={calendar()}
        />
        <p className="mt-3 text-xs text-caption">
          {foods.length}가지 제철
        </p>
        <MoreFoods year={year} foods={foods.filter((food) => !pictured.includes(food))} />
        <MonthDaysCard month={month} year={year} markToday={isThisMonth} className="mt-4 lg:max-w-[420px]" />
      </div>
    </>
  )
}


/** 모바일·데스크톱 프레임의 배치를 모두 그리고 화면 폭에 따라 하나만 보인다(하이드레이션 차이가 없다). desktopCalendar가 있으면 데스크톱 판 위에 달력을 얹는다. */
export function Scatter({
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
