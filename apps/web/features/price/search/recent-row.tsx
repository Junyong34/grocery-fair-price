import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { won } from "@workspace/price/format"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { varietySub } from "../components/variety-row"
import { VerdictChip } from "../components/verdict-chip"

/**
 * P2 빈 검색어의 최근 본 품종 한 줄(44px): 이름 · 규격·단위 · 판정 칩 · 시세 · ›.
 * "방금 보던 품종 다시 열기"라 평소가 · 조사일 · 담기는 뺀다(담기는 상세 헤더에 있다).
 * 같은 이름의 품종을 단위로 가르므로 규격·단위는 남기고, 줄이 좁으면 이름보다 먼저 말줄임한다.
 */
export function RecentRow({ variety }: { variety: VarietySummary }) {
  return (
    <li className="border-b border-hairline last:border-b-0">
      <Link
        href={routes.price.variety(variety.id)}
        className="flex min-h-11 items-center gap-2 rounded-lg py-1.5 no-underline outline-offset-2 hover:bg-mat focus-visible:outline-2 focus-visible:outline-ring active:bg-mat"
      >
        <span className="max-w-[55%] shrink-0 truncate text-[15px] font-semibold text-ink">
          {variety.name}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-caption">
          {varietySub(variety)}
        </span>
        <VerdictChip verdict={variety.verdict} className="shrink-0" />
        <span className="w-[4.5rem] shrink-0 text-right text-[15px] font-semibold text-ink tabular-nums">
          {won(variety.price)}원
        </span>
        <ChevronRight aria-hidden size={16} className="shrink-0 text-mute" />
      </Link>
    </li>
  )
}
