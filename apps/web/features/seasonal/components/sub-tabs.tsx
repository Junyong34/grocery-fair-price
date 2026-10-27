"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { LinkTabs, linkTabProps } from "@workspace/ui/components/link-tabs"
import { cn } from "@workspace/ui/lib/utils"

import { routes } from "@/shared/routes"

import { matchesPath, useIsActive } from "@/shared/shell/nav-link"

// 2차 탭(명세 2.1). cojeev 탭(lenses)을 밝은 트레이에 담고, gold 선택 표시가 탭 사이를 미끄러진다.
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

/** 맨 위에서 이만큼(px) 내려가는 동안 본문 탭이 서서히 사라진다. 헤더가 뜨는 STUCK_AT(8)보다 조금 길어서 헤더 안 작은 탭과 겹쳐 바뀐다. */
const FADE_DISTANCE = 24

/**
 * 본문 위 2차 탭은 맨 위에서 헤더 바(떠 있는 바, 아래 끝 56px) 바로 아래에 있다. 8px만 내려가도 바 뒤로 들어가서
 * 반투명 배경 너머와 바 위 틈으로 비쳐 보인다. 그래서 내려가는 만큼 투명해지게 하고(헤더 안 작은 탭이 이어받는다),
 * 다 사라지면 초점도 막는다. 스타일은 직접 쓰므로 스크롤마다 렌더하지 않는다.
 */
function useFadeUnderHeader() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const update = () => {
      frame = 0
      const opacity = Math.min(1, Math.max(0, 1 - window.scrollY / FADE_DISTANCE))
      el.style.opacity = String(opacity)
      el.inert = opacity === 0
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
      el.style.opacity = ""
      el.inert = false
    }
  }, [])
  return ref
}

function SubTabs({ set, compact = false }: { set: TabSet; compact?: boolean }) {
  // 헤더 안 작은 탭(compact)은 헤더가 다루므로 본문 탭에만 붙인다.
  const fadeRef = useFadeUnderHeader()
  return (
    // 트레이에 담아 한 덩어리로 보이게 하고, 본문과는 아래 여백으로 나눈다(header-styles 비교의 C안, 2026-10-16 지운 비교 페이지).
    <LinkTabs
      ref={compact ? undefined : fadeRef}
      aria-label={set.label}
      tray
      className={compact ? undefined : "mx-auto max-w-[1080px] px-[18px] pt-1 pb-4 lg:px-6 lg:pb-5"}
      listClassName={compact ? "p-0.5" : "w-fit"}
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
      className={cn(linkTabProps.className, compact ? "h-8! px-3! text-[13px]!" : "h-9! px-4! text-sm!")}
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
