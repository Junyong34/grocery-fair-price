"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

type ActiveRule = {
  /** 이 경로들에 있을 때도 활성이다(하위 경로 포함). */
  also?: readonly string[]
  /** true면 href와 같을 때만 활성이다. 아니면 하위 경로까지 활성이다. */
  exact?: boolean
}

/** pathname이 href(와 also)에 해당하는지. */
export function matchesPath(
  pathname: string,
  href: string,
  { also = [], exact = false }: ActiveRule = {}
): boolean {
  const under = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)
  return (exact ? pathname === href : under(href)) || also.some(under)
}

/** 현재 경로가 href(와 also)에 해당하는지. */
export function useIsActive(href: string, rule: ActiveRule = {}): boolean {
  return matchesPath(usePathname(), href, rule)
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
