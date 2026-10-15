"use client"

import Link from "next/link"

import { LinkTabs, linkTabProps } from "@workspace/ui/components/link-tabs"

import { routes } from "@/shared/routes"

import { useIsActive } from "./nav-link"

// 2차 탭(명세 2.1). cojeev 탭(lenses) 모양이고, 선택 표시가 탭 사이를 미끄러진다.
function SubTabs({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <LinkTabs aria-label={label} className="mx-auto max-w-[1080px] px-[18px] pt-1 pb-2 lg:px-6">
      {children}
    </LinkTabs>
  )
}

function SubTab({ href, exact, children }: { href: string; exact?: boolean; children: React.ReactNode }) {
  const active = useIsActive(href, { exact })
  return (
    <Link href={href} aria-current={active ? "page" : undefined} {...linkTabProps}>
      {children}
    </Link>
  )
}

/** 이달 탭의 2차 탭: 이달 | 월별 보기 */
export function ThisMonthTabs() {
  return (
    <SubTabs label="이달 보기 방식">
      <SubTab href={routes.seasonal.root} exact>
        이달
      </SubTab>
      <SubTab href={routes.seasonal.months}>월별 보기</SubTab>
    </SubTabs>
  )
}

/** 계절 탭의 2차 탭: 계절 | 명절 (24절기는 MVP 범위 밖) */
export function SeasonTabs() {
  return (
    <SubTabs label="계절 보기 방식">
      <SubTab href={routes.seasonal.seasons}>계절</SubTab>
      <SubTab href={routes.seasonal.festivals}>명절</SubTab>
    </SubTabs>
  )
}
