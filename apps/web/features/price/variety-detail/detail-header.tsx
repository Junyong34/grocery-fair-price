"use client"

import { useEffect } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"
import { BackButton, SubHeader } from "@/shared/shell/sub-header"

import { toggleBasket } from "../components/basket-toast"
import { varietySub } from "../components/variety-row"
import { useInBasket } from "../stores/basket-store"
import { visitVariety } from "../stores/recent-store"
import { P3_SECTIONS } from "./section-ids"

const COPY = PRICE_COPY.detail

/** P3 본문 맨 위 줄: 품종 이름 · 규격 · 기준 단위. 데스크톱은 ‹ 뒤로와 + 담기 / ✓ 담음도 이 줄에 있다(모바일은 하위 헤더). 연 품종을 최근 본 품종에 넣는다. */
export function DetailHeader({ variety }: { variety: VarietySummary }) {
  useEffect(() => visitVariety(variety.id), [variety.id])

  return (
    <div id={P3_SECTIONS.title} className="flex items-center gap-2">
      <BackButton fallbackHref={routes.home} className="-ml-2 max-lg:hidden" />
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h1 className="truncate font-heading text-[26px] leading-tight font-bold text-ink">
          {variety.name}
        </h1>
        <span className="shrink-0 text-sm text-caption">
          {varietySub(variety)}
        </span>
      </div>
      <KeepButton variety={variety} className="max-lg:hidden" />
    </div>
  )
}

/** 모바일 하위 헤더: "‹ 계란 · 담기"를 처음부터 헤더 자리에 둔다(.scratch/shell-unify/spec.md 3장). 데스크톱은 본문 제목 줄이 같은 일을 한다. */
export function DetailHeaderBar({ variety }: { variety: VarietySummary }) {
  return <SubHeader title={variety.name} fallbackHref={routes.home} actions={<KeepButton variety={variety} className="h-8 px-3 text-[13px]" />} />
}

function KeepButton({
  variety,
  className,
}: {
  variety: VarietySummary
  className?: string
}) {
  const added = useInBasket(variety.id)
  return (
    <button
      type="button"
      aria-pressed={added}
      onClick={() => toggleBasket(variety)}
      className={cn(
        "h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition-colors",
        added
          ? "border-ink bg-ink text-canvas"
          : "border-silver bg-surface text-ink hover:border-stone",
        className
      )}
    >
      {added ? COPY.added : COPY.add}
    </button>
  )
}
