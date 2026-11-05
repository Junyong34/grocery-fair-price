"use client"

import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

import { matchesPath, type ActiveRule } from "./match-path"
import { usePublicPathname } from "./public-path"

export { matchesPath }

/** 현재 경로가 href(와 also)에 해당하는지. */
export function useIsActive(href: string, rule: ActiveRule = {}): boolean {
  return matchesPath(usePublicPathname(), href, rule)
}

/** 현재 경로에 맞으면 aria-current="page"를 다는 링크. 모양은 className과 aria-current 선택자로 정한다. */
export function NavLink({
  href,
  className,
  children,
  ...rule
}: ActiveRule & {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const active = useIsActive(href, rule)
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
