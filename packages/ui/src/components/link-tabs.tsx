"use client"

import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { tabsVariants } from "@workspace/ui/components/tabs"
import { useFlowGroup } from "@workspace/ui/lib/cojeev-motion/use-flow"
import { cn } from "@workspace/ui/lib/utils"

export type LinkTabsProps = React.ComponentProps<"nav"> &
  VariantProps<typeof tabsVariants> & {
    /** 탭 줄(nav 안쪽)의 className. */
    listClassName?: string
    /** true면 탭을 밝은 트레이에 담고 선택 표시를 gold로 칠한다(TRAY_CLASS). */
    tray?: boolean
  }

/**
 * 탭·세그먼트를 담는 트레이. 밝은 바탕에 선택 칸은 gold-soft(하단 내비의 지금 메뉴와 같은 색), 글자는 espresso.
 * 미끄러지는 선택 표시(--glide-*)는 cojeev 레이어가 먼저 정하므로 !로 덮는다.
 */
export const TRAY_CLASS = cn(
  "gap-0! rounded-full border border-hairline bg-surface/75 p-1 shadow-xs shadow-ink/5",
  "[--glide-bg:var(--color-gold-soft)]! [--glide-fg:var(--color-espresso)]! [--glide-ring:none]!",
  "[&>*]:text-stone [&>*:hover]:text-ink",
  // 움직임 레이어가 붙기 전(첫 그림)과 모션을 끈 때에도 선택 칸이 보이게 한다.
  "[&:not(.v-glide)>:is([aria-current=page],[aria-checked=true])]:bg-gold-soft [&:not(.v-glide)>:is([aria-current=page],[aria-checked=true])]:text-espresso"
)

/**
 * 페이지를 오가는 링크 탭. cojeev Tabs와 같은 모양이고, 선택 표시가 aria-current="page" 링크로 미끄러진다.
 * 링크에는 linkTabProps를 펼친다. Tabs는 패널을 바꾸는 탭이라 주소가 바뀌는 탭에는 이것을 쓴다.
 */
export function LinkTabs({
  variant = "lenses",
  className,
  listClassName,
  tray = false,
  children,
  ...props
}: LinkTabsProps) {
  const flowRef = useFlowGroup<HTMLDivElement>(undefined, {
    kind: variant === "underline" ? "bar" : "pill",
    itemSelector: '[data-slot="tabs-trigger"]',
    activeSelector: '[aria-current="page"]',
  })
  return (
    <nav className={className} {...props}>
      <div
        ref={flowRef}
        data-slot="tabs-list"
        data-flow-group=""
        className={cn(
          tabsVariants({ variant }),
          tray
            ? TRAY_CLASS
            : // 움직임 레이어가 붙기 전(첫 그림)과 모션을 끈 때에도 선택 탭이 보이게 한다.
              "[&:not(.v-glide)>[aria-current=page]]:bg-(--v-beige) [&:not(.v-glide)>[aria-current=page]]:text-(--v-text) [&:not(.v-glide)>[aria-current=page]]:shadow-[inset_0_0_0_1px_var(--v-edge)]",
          listClassName
        )}
      >
        {children}
      </div>
    </nav>
  )
}

/** LinkTabs 안 링크에 펼치는 속성(cojeev 탭 모양). */
export const linkTabProps = {
  "data-slot": "tabs-trigger",
  className: "v-tab shrink-0 no-underline aria-[current=page]:font-semibold",
} as const
