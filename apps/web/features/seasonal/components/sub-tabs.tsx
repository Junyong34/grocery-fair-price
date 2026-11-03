"use client"

import Link from "next/link"

import { SASHIMI_COPY } from "@workspace/seasonal/data/copy"
import { LinkTabs, linkTabProps } from "@workspace/ui/components/link-tabs"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { useIsActive } from "@/shared/shell/nav-link"
import { scrollToTopIfCurrent } from "@/shared/shell/scroll-to-top"

// 제철달력 탭(.scratch/shell-unify/spec.md 2장, 제철 회는 .scratch/sashimi/spec.md 1장). 이달 · 월별 · 계절 · 제철 회 · 명절 한 벌을 라우트 그룹 (this-month) · (season)이 같이 쓴다.
// cojeev 탭(lenses)을 밝은 트레이에 담고, gold 선택 표시가 탭 사이를 미끄러진다. 탭 줄은 헤더 아래에 붙어 따라온다.

type Tab = { label: string; href: string; exact?: boolean }

// 24절기는 MVP 범위 밖
const TABS: readonly Tab[] = [
  { label: "이달", href: routes.seasonal.root, exact: true },
  { label: "월별", href: routes.seasonal.months },
  { label: "계절", href: routes.seasonal.seasons },
  { label: SASHIMI_COPY.tab, href: routes.seasonal.sashimi },
  { label: "명절", href: routes.seasonal.festivals },
]

/** 제철달력 탭 줄: 이달 · 월별 · 계절 · 제철 회 · 명절. 헤더 바로 아래에 붙어 스크롤해도 남고, 모바일에서 헤더가 숨으면 맨 위로 올라붙는다(--shell-top). */
export function SeasonalTabs() {
  return (
    <div className="sticky top-14 z-(--z-sticky) bg-canvas/94 backdrop-blur-md motion-safe:transition-[top] motion-safe:duration-300 max-lg:top-(--shell-top)">
      <LinkTabs
        aria-label="제철달력 보기"
        tray
        className="mx-auto max-w-[1080px] px-[18px] pt-1 pb-3 lg:px-6 lg:pb-4"
        listClassName="w-fit"
      >
        {TABS.map((tab) => (
          <SubTab key={tab.href} {...tab} />
        ))}
      </LinkTabs>
    </div>
  )
}

function SubTab({ href, exact, label }: Tab) {
  const active = useIsActive(href, { exact })
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={(event) => scrollToTopIfCurrent(event, active)}
      {...linkTabProps}
      className={cn(linkTabProps.className, "h-9! px-4! text-sm!")}
    >
      {label}
    </Link>
  )
}
