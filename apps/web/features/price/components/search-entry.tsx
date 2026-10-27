import { Search } from "lucide-react"
import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"

import { routes } from "@/shared/routes"

/**
 * 검색창처럼 보이는 링크. 누르면 P2(/search)로 가고, 그 화면의 입력칸이 바로 포커스를 받는다.
 * 메인(/)을 정적으로 두려고 검색어를 /?q=로 받지 않는다(spec P2).
 */
export function SearchEntry({ className }: { className?: string }) {
  return (
    <Link
      href={routes.price.search}
      className={cn(
        "flex h-14 items-center gap-3 rounded-full border border-silver bg-surface px-5 text-base text-caption no-underline shadow-sm shadow-ink/5 transition-colors hover:border-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <Search aria-hidden size={20} className="text-stone" />
      <span>{PRICE_COPY.home.searchPlaceholder}</span>
      <span className="sr-only">{PRICE_COPY.search.label}</span>
    </Link>
  )
}
