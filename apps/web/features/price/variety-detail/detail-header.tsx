"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { PRICE_COPY } from "@workspace/price/copy"
import type { VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"
import { HeaderBar } from "@/shared/shell/site-nav"

import { toggleBasket } from "../components/basket-toast"
import { varietySub } from "../components/variety-row"
import { useInBasket } from "../stores/basket-store"
import { visitVariety } from "../stores/recent-store"

const COPY = PRICE_COPY.detail

/** 본문 제목 줄 표시. 헤더 바(DetailHeaderBar)가 이 줄이 헤더 밑으로 사라졌는지 본다. */
const TITLE_ATTR = "data-detail-title"

/** P3 본문 맨 위 줄: ‹ 뒤로 · 품종 이름 · 규격 · 기준 단위 · + 담기 / ✓ 담음. 연 품종을 최근 본 품종에 넣는다. */
export function DetailHeader({ variety }: { variety: VarietySummary }) {
  useEffect(() => visitVariety(variety.id), [variety.id])

  return (
    <div {...{ [TITLE_ATTR]: "" }} className="flex items-center gap-2">
      <BackButton />
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h1 className="truncate font-heading text-[26px] leading-tight font-bold text-ink">
          {variety.name}
        </h1>
        <span className="shrink-0 text-sm text-caption">
          {varietySub(variety)}
        </span>
      </div>
      <KeepButton variety={variety} />
    </div>
  )
}

/** 본문 제목 줄 아래 끝이 이 높이(px, 헤더 바 아래 끝)보다 위로 올라가면 헤더 바를 보인다. */
const HEADER_BOTTOM = 56

/**
 * 모바일 헤더 바(사이트 헤더의 바 자리에 HeaderBar로 그린다): 스크롤해서 본문 제목 줄이 헤더 밑으로 사라지면
 * 로고 자리에 "‹ 계란 · 담기"가 올라온다. 제목 줄이 다시 보이면 로고로 돌아간다. 데스크톱은 헤더가 그리지 않는다.
 */
export function DetailHeaderBar({ variety }: { variety: VarietySummary }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const title = document.querySelector(`[${TITLE_ATTR}]`)
      setShown(
        title ? title.getBoundingClientRect().bottom < HEADER_BOTTOM : false
      )
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <HeaderBar>
      <div
        data-header-bar={shown ? "" : undefined}
        inert={!shown}
        className={cn(
          "flex h-full items-center gap-1.5 motion-safe:transition-[opacity,translate] motion-safe:duration-300",
          shown
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        )}
      >
        <BackButton className="-ml-1 size-9" />
        <p className="min-w-0 flex-1 truncate font-heading text-[19px] leading-tight font-bold text-ink">
          {variety.name}
        </p>
        <KeepButton variety={variety} className="h-8 px-3 text-[13px]" />
      </div>
    </HeaderBar>
  )
}

function BackButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      aria-label={COPY.back}
      onClick={() =>
        window.history.length > 1 ? router.back() : router.push(routes.home)
      }
      className={cn(
        "-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-ink hover:bg-surface",
        className
      )}
    >
      <ChevronLeft aria-hidden size={24} />
    </button>
  )
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
