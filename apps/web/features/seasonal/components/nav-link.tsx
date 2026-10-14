"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

/**
 * 현재 경로에 맞으면 aria-current로 활성 표시하는 링크.
 * href는 exact면 같을 때만, 아니면 하위 경로까지 활성이다. also에 든 경로는 하위 경로까지 활성이다.
 */
export function NavLink({
  href,
  also = [],
  exact = false,
  className,
  children,
}: {
  href: string
  also?: readonly string[]
  exact?: boolean
  className?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const under = (path: string) => pathname === path || pathname.startsWith(`${path}/`)
  const active = (exact ? pathname === href : under(href)) || also.some(under)
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-stone",
        active && "font-semibold text-ink",
        className
      )}
    >
      {children}
    </Link>
  )
}
