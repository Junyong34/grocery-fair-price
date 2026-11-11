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
    // 제철 화면 전체(이달 · 월별 · 계절 · 제철 회 · 명절 · 이유식 · 내려받기). 나의 식탁만 따로 칸이 있다. 품종 상세는 activeMenuKey가 출발지로 정한다.
    key: "seasonal",
    label: "제철달력",
    href: routes.seasonal.root,
    also: [
      routes.seasonal.months,
      routes.seasonal.seasons,
      routes.seasonal.ingredients,
      routes.seasonal.sashimi,
      routes.seasonal.festivals,
      routes.seasonal.downloads,
      routes.babyFood.root,
    ],
    exact: true,
    Icon: CalendarDays,
  },
  { key: "basket", label: "장바구니", href: routes.price.basket, Icon: ShoppingBasket },
  { key: "my-table", label: "나의 식탁", href: routes.seasonal.myTable, Icon: UtensilsCrossed },
]

const isFoodDetail = (pathname: string) => matchesPath(pathname, routes.seasonal.food("").slice(0, -1))

/** 품종 상세가 활성 칸을 물려받을 출발지. 품종 상세가 아닌 경로를 기억하고, 품종 상세끼리 옮겨 다니는 동안은 그대로 둔다. */
export function nextMenuOrigin(origin: string | null, pathname: string): string | null {
  return isFoodDetail(pathname) ? origin : pathname
}

/**
 * 지금 경로에서 활성인 메뉴의 key. 설정 · 개인정보처럼 어느 칸도 아니면 null.
 * 품종 상세는 시트든 전체 페이지든 주소가 같아, 출발지(origin)의 칸을 따른다. 출발지가 없거나 어느 칸도 아니면 제철달력이다.
 */
export function activeMenuKey(pathname: string, origin: string | null = null): string | null {
  if (isFoodDetail(pathname)) return (origin ? activeMenuKey(origin) : null) ?? "seasonal"
  return MENUS.find(({ href, also, exact }) => matchesPath(pathname, href, { also, exact }))?.key ?? null
}
