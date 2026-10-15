"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { LinkTabs, linkTabProps } from "@workspace/ui/components/link-tabs"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { matchesPath, useIsActive } from "./nav-link"

// 2차 탭(명세 2.1). cojeev 탭(lenses) 모양이고, 선택 표시가 탭 사이를 미끄러진다.
// 헤더가 떠 있을 때는 같은 탭을 작게 헤더 안에 접어 넣는다(HeaderSubTabs).

type Tab = { label: string; href: string; exact?: boolean }
type TabSet = { label: string; tabs: readonly Tab[] }

const THIS_MONTH_TABS: TabSet = {
  label: "이달 보기 방식",
  tabs: [
    { label: "이달", href: routes.seasonal.root, exact: true },
    { label: "월별 보기", href: routes.seasonal.months },
  ],
}
// 24절기는 MVP 범위 밖
const SEASON_TABS: TabSet = {
  label: "계절 보기 방식",
  tabs: [
    { label: "계절", href: routes.seasonal.seasons },
    { label: "명절", href: routes.seasonal.festivals },
  ],
}

function SubTabs({ set, compact = false }: { set: TabSet; compact?: boolean }) {
  return (
    <LinkTabs
      aria-label={set.label}
      className={compact ? undefined : "mx-auto max-w-[1080px] px-[18px] pt-1 pb-2 lg:px-6"}
      listClassName={compact ? "gap-0.5!" : undefined}
    >
      {set.tabs.map((tab) => (
        <SubTab key={tab.href} {...tab} compact={compact} />
      ))}
    </LinkTabs>
  )
}

function SubTab({ href, exact, label, compact }: Tab & { compact: boolean }) {
  const active = useIsActive(href, { exact })
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      {...linkTabProps}
      className={cn(linkTabProps.className, compact && "h-8! px-3! text-[13px]!")}
    >
      {label}
    </Link>
  )
}

/** 이달 탭의 2차 탭: 이달 | 월별 보기 */
export function ThisMonthTabs() {
  return <SubTabs set={THIS_MONTH_TABS} />
}

/** 계절 탭의 2차 탭: 계절 | 명절 */
export function SeasonTabs() {
  return <SubTabs set={SEASON_TABS} />
}

/** 헤더가 떠 있을 때 헤더 안에 접어 넣는 지금 화면의 2차 탭. 2차 탭이 없는 화면(나의 식탁 등)에서는 비어 있다. */
export function HeaderSubTabs() {
  const pathname = usePathname()
  const set = [THIS_MONTH_TABS, SEASON_TABS].find((candidate) =>
    candidate.tabs.some((tab) => matchesPath(pathname, tab.href, { exact: tab.exact }))
  )
  return set ? <SubTabs set={set} compact /> : null
}
