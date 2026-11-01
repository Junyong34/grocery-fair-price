import { Search } from "lucide-react"
import Link from "next/link"

/** 루트 헤더의 🔍 링크. 가격 화면은 P2 검색 화면으로 간다(제철 화면은 오버레이 버튼을 따로 쓴다). */
export function SearchLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-full text-ink no-underline hover:bg-gold-wash focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Search aria-hidden size={20} strokeWidth={1.6} />
    </Link>
  )
}
