import Link from "next/link"
import { ArrowRight, CalendarRange, Gift, Leaf, type LucideIcon } from "lucide-react"

import { UI_COPY } from "@workspace/seasonal/data/copy"
import { Button } from "@workspace/ui/components/button"

import { routes } from "@/shared/routes"

import { YearEndSummary } from "./year-end-summary"

/** 다른 화면으로 가는 길. 이름은 2차 탭·내비와 같은 말을 쓴다(월별 보기, 계절, 명절). */
function moreLinks(thisMonth: number): readonly { label: string; hint: string; href: string; Icon: LucideIcon }[] {
  return [
    { label: "월별 보기", hint: "열두 달 제철을 나란히 비교해요", href: routes.seasonal.month(thisMonth), Icon: CalendarRange },
    { label: "계절", hint: "봄·여름·가을·겨울로 묶어 봐요", href: routes.seasonal.seasons, Icon: Leaf },
    { label: "명절", hint: "명절에 오르는 제철을 찾아봐요", href: routes.seasonal.festivals, Icon: Gift },
  ]
}

/**
 * 2a 이달 맨 아래. 열두 달 스크롤이 끝난 자리에서 올해 먹음 기록(나의 식탁)으로 이어 주고,
 * 그 아래에 다른 보기(월별 보기·계절·명절)를 설명과 함께 둔다.
 */
export function YearEnd({ year, thisMonth }: { year: number; thisMonth: number }) {
  return (
    <footer className="flex flex-col gap-8 border-t border-hairline pr-12 pl-[18px] pt-12 pb-10 lg:px-0">
      <h2 className="font-heading text-[28px] leading-tight lg:text-[32px]">{UI_COPY.yearEndTitle}</h2>

      <section aria-label="나의 식탁" className="flex flex-col gap-4 rounded-3xl border border-gold-pale/45 bg-gold-wash p-5 lg:p-6">
        <p className="text-sm text-stone">나의 식탁 · {year}</p>
        <YearEndSummary year={year} />
        <p className="text-sm text-stone">{UI_COPY.yearEndMyTableHint}</p>
        <Button asChild className="self-start">
          <Link href={routes.seasonal.myTable} className="no-underline">
            {UI_COPY.yearEndMyTableAction}
            <ArrowRight aria-hidden size={16} />
          </Link>
        </Button>
      </section>

      <nav aria-labelledby="year-end-more" className="flex flex-col gap-3">
        <h3 id="year-end-more" className="text-sm text-stone">
          {UI_COPY.yearEndMoreTitle}
        </h3>
        <ul className="grid gap-2.5 lg:grid-cols-3">
          {moreLinks(thisMonth).map(({ label, hint, href, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group/more flex h-full items-center gap-3.5 rounded-2xl border border-hairline bg-surface/60 p-4 text-ink no-underline transition-colors duration-200 hover:bg-surface hover:text-ink motion-safe:active:scale-[0.98] lg:flex-col lg:items-start lg:gap-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-wash text-gold-deep">
                  <Icon aria-hidden size={20} strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{label}</span>
                  <span className="mt-0.5 block text-sm text-stone">{hint}</span>
                </span>
                <ArrowRight
                  aria-hidden
                  size={18}
                  className="shrink-0 text-caption transition-transform duration-200 group-hover/more:translate-x-0.5 lg:hidden"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  )
}
