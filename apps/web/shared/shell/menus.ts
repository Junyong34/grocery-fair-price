import {
  CalendarDays,
  ChartLine,
  Leaf,
  ShoppingBasket,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"

import { routes } from "@/shared/routes"

// 주요 메뉴. 헤더와 하단 내비는 가격과 제철이 같이 쓰고, 메뉴만 영역에 따라 바뀐다(.scratch/price-screens/spec.md 2장).
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

/** 메뉴 영역. 셸을 그리는 레이아웃이 고른다. */
export type MenuArea = "price" | "seasonal"

const PRICE: MenuItem = {
  key: "price",
  // 판정 화면 메뉴 이름은 "판정"이 아니라 "시세"다.
  label: "시세",
  href: routes.home,
  also: [routes.price.search, routes.price.varieties],
  exact: true,
  Icon: ChartLine,
}
// 지금의 "이달". 월별 보기도 활성이다.
const SEASONAL: MenuItem = {
  key: "seasonal",
  label: "제철달력",
  href: routes.seasonal.root,
  also: [routes.seasonal.months],
  exact: true,
  Icon: CalendarDays,
}

export const MENUS: Record<MenuArea, readonly MenuItem[]> = {
  price: [
    PRICE,
    SEASONAL,
    { key: "basket", label: "담은 품종", href: routes.price.basket, Icon: ShoppingBasket },
  ],
  seasonal: [
    PRICE,
    SEASONAL,
    // 명절도 계절 메뉴 아래다.
    { key: "seasons", label: "계절", href: routes.seasonal.seasons, also: [routes.seasonal.festivals], Icon: Leaf },
    { key: "my-table", label: "나의 식탁", href: routes.seasonal.myTable, Icon: UtensilsCrossed },
  ],
}
