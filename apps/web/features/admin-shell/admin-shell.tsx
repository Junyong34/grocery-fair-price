"use client"

import { BookOpen, Carrot, ClipboardCheck, LayoutTemplate, Printer } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

import { routes } from "@/shared/routes"

import { ADMIN_NAV, isActive, type AdminNavItem } from "./admin-nav"

import "./admin-shell.css"

const ICONS: Record<AdminNavItem["icon"], typeof Printer> = { editions: Printer, wireframes: LayoutTemplate, babyFood: BookOpen, varieties: Carrot, proposals: ClipboardCheck }

// 어드민 화면 공통 틀: 왼쪽 메뉴(모바일은 시트) + 본문. 인쇄(PDF 생성)할 때는 메뉴와 상단 줄을 숨긴다 (admin-shell.css).
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const current = ADMIN_NAV.flatMap((g) => g.items).find((i) => isActive(i, path))
  return (
    <SidebarProvider className="admin-shell">
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <Link href={routes.admin.root} className="px-2 py-1.5 font-heading text-lg font-bold">
            장볼날 어드민
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {ADMIN_NAV.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = ICONS[item.icon]
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton isActive={isActive(item, path)} render={<Link href={item.href} />}>
                          <Icon aria-hidden />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 bg-canvas">
        <header className="admin-shell-bar sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-hairline bg-canvas px-4">
          <SidebarTrigger aria-label="메뉴 열고 닫기" />
          <span className="text-sm text-stone">{current?.label ?? "어드민"}</span>
        </header>
        <div className="admin-ui mx-auto w-full max-w-[1200px] px-4 py-8 text-ink md:px-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
