import {
  CalendarDays,
  ChartLine,
  ShoppingBasket,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"

import { routes } from "@/shared/routes"

import { matchesPath } from "./match-path"

// 주요 메뉴. 어느 화면에서나 같은 4칸이다(.scratch/shell-unify/spec.md 1장).
// 모바일은 하단 떠 있는 내비, 데스크톱(≥1024)은 헤더 안에 같은 목록이 보인다.

export type MenuItem = {
  /** 레이아웃이 넣는 배지(badges)의 키이자 React key */
  key: string
  label: string
  href: string
  /** 이 경로들에 있을 때도 활성이다(하위 경로 포함). */
  also?: readonly string[]
  /** true면 href와 같을 때만 활성이다. */
  exact?: boolean
  Icon: LucideIcon
}

export const MENUS: readonly MenuItem[] = [
  {
    key: "price",
    // 판정 화면 메뉴 이름은 "판정"이 아니라 "시세"다.
    label: "시세",
    href: routes.home,
    also: [routes.price.search, routes.price.varieties],
    exact: true,
    Icon: ChartLine,
  },
  {
    // 제철 화면 전체(이달 · 월별 · 계절 · 명절 · 품종 상세 · 내려받기). 나의 식탁만 따로 칸이 있다.
    key: "seasonal",
    label: "제철달력",
    href: routes.seasonal.root,
    also: [
      routes.seasonal.months,
      routes.seasonal.seasons,
      routes.seasonal.festivals,
      routes.seasonal.food("").slice(0, -1),
      routes.seasonal.downloads,
    ],
    exact: true,
    Icon: CalendarDays,
  },
  { key: "basket", label: "담은 품종", href: routes.price.basket, Icon: ShoppingBasket },
  { key: "my-table", label: "나의 식탁", href: routes.seasonal.myTable, Icon: UtensilsCrossed },
]

/** 지금 경로에서 활성인 메뉴의 key. 설정 · 개인정보처럼 어느 칸도 아니면 null. */
export function activeMenuKey(pathname: string): string | null {
  return MENUS.find(({ href, also, exact }) => matchesPath(pathname, href, { also, exact }))?.key ?? null
}
