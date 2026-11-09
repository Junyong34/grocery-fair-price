import { routes } from "@/shared/routes"

// 어드민 왼쪽 메뉴. 새 어드민 화면은 여기에 한 줄 더한다 (경로는 routes.admin에 먼저 정한다).
// match: 지금 주소가 이 메뉴에 속하는지. 없으면 href로 시작하는 주소를 모두 이 메뉴로 본다.
export type AdminNavItem = { label: string; href: string; icon: "editions" | "wireframes" | "babyFood" | "varieties" | "proposals"; match?: (path: string) => boolean }
export type AdminNavGroup = { label: string; items: readonly AdminNavItem[] }

export const ADMIN_NAV: readonly AdminNavGroup[] = [
  {
    label: "인쇄물",
    items: [
      { label: "에디션", href: routes.admin.root, icon: "editions", match: (p) => p === routes.admin.root || p.startsWith("/admin/edit") },
      { label: "와이어프레임", href: routes.admin.wireframes, icon: "wireframes" },
      { label: "이유식 궁합표", href: routes.admin.babyFoodPrint, icon: "babyFood", match: (p) => p.startsWith("/admin/baby-food") },
    ],
  },
  {
    label: "식재료 관리",
    items: [
      { label: "식재료 목록", href: routes.admin.catalogVarieties, icon: "varieties" },
      { label: "제안 검토", href: routes.admin.catalogProposals, icon: "proposals" },
    ],
  },
]

export function isActive(item: AdminNavItem, path: string): boolean {
  return item.match ? item.match(path) : path === item.href || path.startsWith(`${item.href}/`)
}
