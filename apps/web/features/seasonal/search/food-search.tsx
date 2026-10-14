"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { overlay } from "overlay-kit"
import { useEffect, useState } from "react"

import { FOODS } from "@workspace/seasonal/data/foods"
import { formatSeasonMonths } from "@workspace/seasonal/data/months"
import { matchFoods } from "@workspace/seasonal/search/match-foods"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { routes } from "@/shared/routes"

import { FoodImage } from "../components/food-image"

/**
 * 전역 품종 검색(spec "전역 검색"). 이름·다른 이름·초성으로 찾고, 고르면 품종 상세(제철 화면 안에서는 시트)로 간다.
 * 거르기는 cmdk 대신 matchFoods가 맡는다(초성·별칭, 앞에서 맞는 것 먼저).
 */
function FoodSearchDialog({
  open,
  onClose,
  onExited,
}: {
  open: boolean
  onClose: () => void
  onExited: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const results = matchFoods(FOODS, query)

  // 닫힘 애니메이션이 끝나면 overlay-kit에서 지운다.
  useEffect(() => {
    if (open) return
    const timer = setTimeout(onExited, 300)
    return () => clearTimeout(timer)
  }, [open, onExited])

  return (
    // cojeev CommandDialog는 cmdk 옵션(shouldFilter)을 넘기지 않아, 같은 구성을 직접 짠다.
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="p-0">
        <DialogTitle className="sr-only">제철 음식 검색</DialogTitle>
        <DialogDescription className="sr-only">
          이름이나 초성으로 찾아요
        </DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="음식 이름 검색 (예: 전어, ㅈㅇ)"
            leading={<Search aria-hidden size={18} strokeWidth={1.6} />}
          />
          <CommandList className="max-h-[min(420px,60svh)]">
            <CommandEmpty>
              &quot;{query}&quot;에 맞는 제철음식이 없어요.
            </CommandEmpty>
            {results.map((food) => (
              <CommandItem
                key={food.id}
                value={food.id}
                onSelect={() => {
                  onClose()
                  router.push(routes.seasonal.food(food.id))
                }}
                // cojeev 행 꾸밈(이름 기반 아이콘)은 끄고, 품종 그림을 앞에 둔 왼쪽 정렬 한 줄로 쓴다.
                adornment={false}
                className="flex! items-center justify-start! gap-3 text-left after:ml-auto"
              >
                <span className="block size-9 shrink-0">
                  <FoodImage food={food} sizes="36px" showName={false} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">{food.name}</span>
                  <span className="text-xs text-stone">
                    {formatSeasonMonths(food.months)}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function openFoodSearch() {
  overlay.open(({ isOpen, close, unmount }) => (
    <FoodSearchDialog open={isOpen} onClose={close} onExited={unmount} />
  ))
}

/** 모바일 헤더의 검색 버튼. */
export function MobileSearchButton() {
  return (
    <button
      type="button"
      onClick={openFoodSearch}
      aria-label="음식 검색"
      className="grid size-10 place-items-center rounded-full text-ink hover:bg-surface"
    >
      <Search aria-hidden size={20} strokeWidth={1.6} />
    </button>
  )
}

/**
 * 데스크톱 상단 바의 "음식 검색" 입력 모양 버튼. 누르거나 어디서든 "/"를 누르면 검색이 열린다.
 * 입력란에 글자를 치는 중이면 "/"를 가로채지 않는다.
 */
export function DesktopSearchButton() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable=true]"))
        return
      event.preventDefault()
      openFoodSearch()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <button
      type="button"
      onClick={openFoodSearch}
      aria-keyshortcuts="/"
      className="flex h-9 w-[200px] items-center gap-2 rounded-md border border-hairline bg-surface px-3 text-left text-sm text-ash hover:border-silver"
    >
      <Search aria-hidden size={16} strokeWidth={1.6} />
      <span className="flex-1">음식 검색</span>
      <kbd className="rounded border border-hairline px-1.5 font-sans text-[11px] text-stone">
        /
      </kbd>
    </button>
  )
}
