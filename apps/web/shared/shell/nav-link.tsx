"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

import { matchesPath, type ActiveRule } from "./match-path"

export { matchesPath }

/** 현재 경로가 href(와 also)에 해당하는지. */
export function useIsActive(href: string, rule: ActiveRule = {}): boolean {
  return matchesPath(usePathname(), href, rule)
}

/** 활성이면 aria-current="page"를 다는 링크. 모양은 className과 aria-current 선택자로 정한다. */
export function NavLink({
  href,
  active,
  className,
  children,
}: {
  href: string
  active: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("no-underline", className)}
    >
      {children}
    </Link>
  )
}
