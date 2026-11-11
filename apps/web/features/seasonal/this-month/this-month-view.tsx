import Link from "next/link"

import { MONTHS, type Month } from "@workspace/seasonal/data/months"
import { TextReveal } from "@workspace/ui/components/text-reveal"

import { routes } from "@/shared/routes"

import { DownloadsCard } from "@/shared/downloads/downloads-card"
import { HERO_ID } from "./active-month"
import { DesktopMonthPanel } from "./desktop-month-panel"
import { JumpButton, MonthRail } from "./month-jump"
import { LazyMonth } from "./lazy-month"
import { MonthScrollSpy } from "./month-scroll-spy"
import { monthContent, MonthSectionBody, Scatter } from "./month-section"
import { MonthShell } from "./month-shell"
import { SettingsScope } from "./settings-scope"
import { YearEnd } from "./year-end"

/**
 * 2a 이달 · 12개월 스크롤(명세 3.1). 각 달은 "흩어진 제철 그림 → 달력" 순서다.
 * 모바일은 한 열 + 위 인디케이터 + 오른쪽 월 레일, 데스크톱은 왼쪽 고정 패널(달 이동 휠) + 오른쪽 스크롤.
 * (연, 월)만으로 그려 빌드 때 미리 만든다(.scratch/seasonal-static/spec.md). 일 단위 "오늘" 표시는 브라우저가 첫 그리기 전에 켠다(shared/today-mark).
 * 서버는 1월(히어로 바로 아래라 첫 화면에 걸린다) · 이번 달 · 다음 달 섹션만 그리고, 나머지 달은 틀만 두었다가 화면 가까이 오면 브라우저가 그린다(LazyMonth).
 * 1월까지 늦게 그리면 첫 화면의 1월 제목이 JS를 받은 뒤에야 나타나 모바일 LCP가 11초를 넘었다(baseline.md "13").
 * 12개월을 한 번에 그리면 DOM 8천여 개 · HTML 0.8MB였다(.scratch/seasonal-render-perf/spec.md 6.3).
 */
export function ThisMonthView({ year, month: thisMonth }: { year: number; month: Month }) {
  const months = MONTHS.map((month) => ({ month, ...monthContent(month) }))
  const current = months[thisMonth - 1]!

  return (
    <SettingsScope>
      <MonthScrollSpy />
      <div className="mx-auto max-w-[600px] lg:grid lg:max-w-[1080px] lg:grid-cols-[280px_1fr] lg:px-6">
        {/* 패널은 헤더(56px)와 탭 줄(~66px) 아래에 붙는다. 히어로의 lg:scroll-mt-32와 같은 128px이다. */}
        <aside className="hidden lg:block">
          <div className="sticky top-32 max-h-[calc(100svh-128px)] overflow-y-auto">
            <DesktopMonthPanel
              thisMonth={thisMonth}
              months={months.map(({ month, foods, note }) => ({ month, note, count: foods.length }))}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <section id={HERO_ID} aria-labelledby="hero-title" className="scroll-mt-16 pr-12 pl-[18px] pt-10 pb-7 lg:scroll-mt-32 lg:px-0 lg:pt-12">
            {/* 처음 들어오면 바로 보인다(모바일 LCP가 이 제목이다). 다른 화면에 갔다 돌아올 때만 부드럽게 나타나고, 제목 다음에 설명이 이어진다. */}
            <TextReveal
              revealOnMount={false}
              as="h1"
              id="hero-title"
              text={`지금은 ${thisMonth}월`}
              variant="soften"
              split="grapheme"
              duration={500}
              className="font-heading text-[46px] leading-tight lg:text-[64px]"
            />
            <TextReveal
              revealOnMount={false}
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
                  {current.foods.length}가지 제철
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
              <DownloadsCard placement="this-month" className="mt-6 lg:max-w-[420px]" />
            </div>
          </section>

          {MONTHS.map((month) =>
            month === 1 || month === thisMonth || month === thisMonth + 1 ? (
              <MonthShell key={month} month={month}>
                <MonthSectionBody year={year} month={month} isThisMonth={month === thisMonth} />
              </MonthShell>
            ) : (
              <LazyMonth key={month} year={year} month={month} />
            ),
          )}

          <YearEnd year={year} thisMonth={thisMonth} />
        </div>
      </div>
      <MonthRail />
    </SettingsScope>
  )
}
